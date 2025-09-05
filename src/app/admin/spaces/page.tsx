'use client';
import { useEffect, useState } from 'react';
import { fetch } from '@/utils/api-client';
import PageLayout from '@/app/components/ui/PageLayout';
import PageHeader from '@/app/components/ui/PageHeader';

export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const load = async () => {
    const res = await fetch('/api/spaces'); // admin list
    const d = await res.json();
    setSpaces(d.spaces || []);
  };
  useEffect(() => {
    load();
  }, []);
  const approve = async (id: string) => {
    await fetch(`/api/spaces/${id}/approve`, 'POST');
    load();
  };

  return (
    <PageLayout>
      <PageHeader title="Admin — Espaces" icon={'🛡️'} />
      <div className="bg-white shadow rounded p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th>Nom</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {spaces.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.name}</td>
                <td>{s.slug}</td>
                <td>{s.status}</td>
                <td>
                  {s.status === 'PENDING' && (
                    <button
                      onClick={() => approve(s.id)}
                      className="bg-primary-600 text-white px-3 py-1 rounded"
                    >
                      Valider
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  );
}
