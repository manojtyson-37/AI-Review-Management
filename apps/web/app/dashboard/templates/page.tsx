"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Copy, Pencil, Trash2, Check, X, BookTemplate } from "lucide-react";
import { useState } from "react";

interface Template {
  id: string;
  name: string;
  category: string;
  text: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Thank You': 'bg-green-100 text-green-700 border-green-200',
  'Apology': 'bg-red-100 text-red-700 border-red-200',
  'Follow-up': 'bg-blue-100 text-blue-700 border-blue-200',
  'Generic': 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editName, setEditName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Thank You");
  const [newText, setNewText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await apiClient.get('/templates');
      return res.data;
    }
  });

  const categories = ['all', ...new Set(templates?.map(t => t.category) || [])];
  const filtered = activeFilter === 'all' ? templates : templates?.filter(t => t.category === activeFilter);

  const handleCopy = (template: Template) => {
    navigator.clipboard.writeText(template.text);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (template: Template) => {
    setEditingId(template.id);
    setEditText(template.text);
    setEditName(template.name);
  };

  const handleSaveEdit = () => {
    queryClient.setQueryData(['templates'], (old: Template[] | undefined) => {
      if (!old) return old;
      return old.map(t => t.id === editingId ? { ...t, name: editName, text: editText } : t);
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    queryClient.setQueryData(['templates'], (old: Template[] | undefined) => {
      if (!old) return old;
      return old.filter(t => t.id !== id);
    });
  };

  const handleAddNew = () => {
    if (!newName || !newText) return;
    const newTemplate: Template = {
      id: `tpl_${Date.now()}`,
      name: newName,
      category: newCategory,
      text: newText,
    };
    queryClient.setQueryData(['templates'], (old: Template[] | undefined) => {
      return [...(old || []), newTemplate];
    });
    setNewName("");
    setNewText("");
    setShowNewForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Reply Templates
          </h2>
          <p className="text-muted-foreground mt-1">
            Save and reuse reply templates. Use <code className="bg-muted px-1 py-0.5 rounded text-xs">{"{{author}}"}</code> to auto-fill the reviewer's name.
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={activeFilter === cat ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter(cat)}
            className="capitalize"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* New Template Form */}
      {showNewForm && (
        <Card className="border-2 border-dashed border-primary/40 animate-in fade-in slide-in-from-top-4">
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Template Name</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Warm Thank You"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                >
                  <option>Thank You</option>
                  <option>Apology</option>
                  <option>Follow-up</option>
                  <option>Generic</option>
                </select>
              </div>
            </div>
            <Textarea
              placeholder="Write your template text here... Use {{author}} for the reviewer's name."
              className="min-h-[100px]"
              value={newText}
              onChange={e => setNewText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewForm(false)}>Cancel</Button>
              <Button onClick={handleAddNew} disabled={!newName || !newText}>Save Template</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Cards */}
      <div className="grid gap-4">
        {filtered?.map(template => (
          <Card key={template.id} className="overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              {editingId === template.id ? (
                <div className="space-y-3 animate-in fade-in">
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <Textarea
                    className="min-h-[100px]"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Generic']}`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm">{template.text}</p>
                  </div>
                  <div className="flex md:flex-col gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleCopy(template)}>
                      {copiedId === template.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copiedId === template.id ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleEdit(template)}>
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-red-500 hover:text-red-600" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filtered?.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No templates found</h3>
            <p className="text-muted-foreground">Create your first template to speed up your replies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
