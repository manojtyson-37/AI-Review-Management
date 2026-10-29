import { ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  const review = {
    id: 'r1',
    googleReviewName: 'accounts/1/locations/2/reviews/3',
    locationId: 'loc1',
    status: 'DRAFTED',
    location: { businessId: 'biz1', business: { name: 'Clinic' } },
  };
  let prisma: any, ai: any, google: any, api: any, access: any, svc: ReviewsService;

  beforeEach(() => {
    prisma = {
      googleReview: { findUnique: jest.fn().mockResolvedValue(review), update: jest.fn().mockResolvedValue({}), upsert: jest.fn(), updateMany: jest.fn() },
      location: { findMany: jest.fn(), update: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    ai = { generateReviewReply: jest.fn().mockResolvedValue('Thank you!') };
    google = { getAccessToken: jest.fn().mockResolvedValue('tok') };
    api = { putReply: jest.fn().mockResolvedValue(undefined), listReviews: jest.fn() };
    access = { assertRole: jest.fn().mockResolvedValue(undefined) };
    svc = new ReviewsService(prisma, ai, google, api, access);
  });

  it('does not post to Google when the user lacks access', async () => {
    access.assertRole.mockRejectedValue(new ForbiddenException());
    await expect(svc.postReply('u1', 'r1', 'hi')).rejects.toBeInstanceOf(ForbiddenException);
    expect(api.putReply).not.toHaveBeenCalled();
  });

  it('rejects empty and oversized replies before touching Google', async () => {
    await expect(svc.postReply('u1', 'r1', '   ')).rejects.toThrow('empty');
    await expect(svc.postReply('u1', 'r1', 'x'.repeat(4001))).rejects.toThrow('4000');
    expect(api.putReply).not.toHaveBeenCalled();
  });

  it('posts the approved reply, marks it replied and writes an audit entry', async () => {
    await svc.postReply('u1', 'r1', ' Thanks for visiting ');
    expect(api.putReply).toHaveBeenCalledWith('tok', review.googleReviewName, 'Thanks for visiting');
    expect(prisma.googleReview.update.mock.calls[0][0].data).toMatchObject({ status: 'REPLIED', replyContent: 'Thanks for visiting' });
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('refuses to overwrite an existing reply', async () => {
    prisma.googleReview.findUnique.mockResolvedValue({ ...review, status: 'REPLIED' });
    await expect(svc.postReply('u1', 'r1', 'again')).rejects.toThrow('already has a reply');
    expect(api.putReply).not.toHaveBeenCalled();
  });

  it('keeps the review unreplied if Google rejects the post', async () => {
    api.putReply.mockRejectedValue(new Error('boom'));
    await expect(svc.postReply('u1', 'r1', 'hi')).rejects.toThrow('boom');
    expect(prisma.googleReview.update).not.toHaveBeenCalled();
  });

  it('draft generation never posts to Google', async () => {
    await svc.generateDraft('u1', 'r1');
    expect(api.putReply).not.toHaveBeenCalled();
    expect(prisma.googleReview.update.mock.calls[0][0].data).toMatchObject({ status: 'DRAFTED', draftReply: 'Thank you!' });
  });

  it('sync maps ratings, keeps Google replies and skips unrated entries', async () => {
    prisma.location.findMany.mockResolvedValue([{ id: 'loc1', googleAccountId: '1', googleLocationId: '2' }]);
    api.listReviews.mockResolvedValue([
      { name: 'a', starRating: 'FIVE', comment: 'great', createTime: '2026-01-01T00:00:00Z', reviewer: { displayName: 'Asha K' } },
      { name: 'b', starRating: 'ONE', createTime: '2026-01-02T00:00:00Z', reviewer: { isAnonymous: true }, reviewReply: { comment: 'sorry', updateTime: '2026-01-03T00:00:00Z' } },
      { name: 'c', starRating: 'STAR_RATING_UNSPECIFIED', createTime: '2026-01-04T00:00:00Z' },
    ]);
    const out = await svc.sync('biz1');
    expect(api.listReviews).toHaveBeenCalledWith('tok', 'accounts/1/locations/2');
    expect(prisma.googleReview.upsert).toHaveBeenCalledTimes(2);
    const b = prisma.googleReview.upsert.mock.calls[1][0];
    expect(b.create).toMatchObject({ rating: 1, status: 'REPLIED', reviewerName: 'A Google user' });
    expect(out).toEqual({ locations: 1, reviews: 2, failed: 0 });
  });
});
