'use client';
import { useSpace } from '@/app/components/providers/SpaceProvider';
import { fetch } from '@/utils/api-client';
import { useState } from 'react';
import PageLayout from '@/app/components/ui/PageLayout';
import PageHeader from '@/app/components/ui/PageHeader';

export default function SpacesPage() {
  const { spaces } = useSpace();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    const res = await fetch('/api/spaces', 'POST', { name: name.trim(), description: desc });
    const d = await res.json();
    setMsg(res.ok ? 'Demande envoyée, en attente de validation.' : d?.error || 'Erreur');
  };

  return (
    <PageLayout>
      <PageHeader title="Mes espaces" icon="📖" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Espaces</h3>
          <ul className="divide-y">
            {spaces.map((s) => (
              <li key={s.id} className="py-2 flex justify-between">
                <span>
                  {s.name} <span className="text-xs text-gray-500">({s.status.toLowerCase()})</span>
                </span>
                <a className="text-primary-600 hover:underline" href={`/spaces/${s.id}/members`}>
                  Membres
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Demande de création</h3>
          <div className="space-y-2">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Nom de l'espace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Description (optionnel)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <button
              onClick={submit}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-900"
            >
              Demander la création
            </button>
            {msg && <p className="text-sm mt-2">{msg}</p>}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
