import { useState } from 'react';
import type { Newsletter, NewsletterSection } from '../api/newsletters';
import { useNewsletters, useCreateNewsletter, useAttachPost, useDetachPost } from '../api/newsletters';
import { useCategories, usePosts } from '../api/posts';

// --- Section panel shown when a newsletter is expanded ---
function SectionPanel({
  newsletter,
  section,
}: {
  newsletter: Newsletter;
  section: NewsletterSection;
}) {
  const { data: categoryPosts = [] } = usePosts(undefined, section.category.id);
  const attachPost = useAttachPost();
  const detachPost = useDetachPost();

  const attachedIds = new Set(section.posts.map((p) => p.post.id));
  const available = categoryPosts.filter((p) => !attachedIds.has(p.id));

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Section {section.order} — {section.category.name}
      </h4>

      {/* Attached posts */}
      {section.posts.length === 0 ? (
        <p className="text-xs text-gray-400 mb-3">No posts attached yet.</p>
      ) : (
        <ul className="space-y-1 mb-3">
          {section.posts.map(({ post }) => (
            <li key={post.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{post.title}</span>
              <button
                onClick={() => detachPost.mutate({ newsletterId: newsletter.id, sectionId: section.id, postId: post.id })}
                className="text-red-500 hover:text-red-700 text-xs ml-4"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add post dropdown */}
      {available.length > 0 && (
        <select
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return;
            attachPost.mutate({ newsletterId: newsletter.id, sectionId: section.id, postId: Number(e.target.value) });
            e.target.value = '';
          }}
          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">+ Add post…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      )}

      {available.length === 0 && section.posts.length > 0 && (
        <p className="text-xs text-gray-400">All posts in this category are attached.</p>
      )}
    </div>
  );
}

// --- Newsletter row with expand/collapse ---
function NewsletterRow({ newsletter }: { newsletter: Newsletter }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow mb-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-medium text-gray-800">{newsletter.title}</span>
        <span className="text-gray-400 text-sm">{expanded ? '▲ collapse' : '▼ expand'}</span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {newsletter.sections.map((section) => (
            <SectionPanel key={section.id} newsletter={newsletter} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Create newsletter modal ---
function CreateModal({ onClose }: { onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const createNewsletter = useCreateNewsletter();

  const [title, setTitle] = useState('');
  const [sectionCategories, setSectionCategories] = useState<number[]>([0, 0, 0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createNewsletter.mutateAsync({
      title,
      sections: sectionCategories.map((categoryId, i) => ({ categoryId, order: i + 1 })),
    });
    onClose();
  }

  function setSection(index: number, categoryId: number) {
    setSectionCategories((prev) => prev.map((v, i) => (i === index ? categoryId : v)));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">New newsletter</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {[0, 1, 2].map((i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section {i + 1} category</label>
              <select
                value={sectionCategories[i]}
                onChange={(e) => setSection(i, Number(e.target.value))}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0} disabled>Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Page ---
export default function Newsletters() {
  const { data: newsletters = [], isLoading } = useNewsletters();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Newsletters</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New newsletter
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {!isLoading && newsletters.length === 0 && (
        <p className="text-sm text-gray-500">No newsletters yet.</p>
      )}

      {newsletters.map((n) => (
        <NewsletterRow key={n.id} newsletter={n} />
      ))}

      {modalOpen && <CreateModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
