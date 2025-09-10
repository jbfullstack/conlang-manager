'use client';
import { useEffect, useState } from 'react';
import { useSpace } from '@/app/components/providers/SpaceProvider';
import { patchSpaceMember } from '@/utils/api-client';
import PageLayout from '@/app/components/ui/PageLayout';
import PageHeader from '@/app/components/ui/PageHeader';

type MemberRow = {
  user: { id: string; username: string; email: string; role: string };
  role: 'OWNER' | 'MODERATOR' | 'MADROLE' | 'MEMBER';
  isActive: boolean;
};

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { current, role } = useSpace();
  const [rows, setRows] = useState<MemberRow[]>([]);
  const { id } = await params;

  const load = async () => {
    const res = await fetch(`/api/spaces/${id}/members?spaceId=${id}`);
    const d = await res.json();
    setRows(d.members || []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateRole = async (userId: string, newRole: MemberRow['role']) => {
    await patchSpaceMember(id, { userId, role: newRole });
    load();
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    await patchSpaceMember(id, { userId, isActive });
    load();
  };

  const canManage = role === 'OWNER' || role === 'MODERATOR' || role === 'MADROLE';

  return (
    <PageLayout>
      <PageHeader title={`Membres — ${current?.name ?? ''}`} icon={'👥'} />
      <div className="bg-white shadow rounded p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th>User</th>
              <th>Email</th>
              <th>Global role</th>
              <th>Espace</th>
              <th>Actif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m: any) => (
              <tr key={m.user.id} className="border-t">
                <td className="py-2">{m.user.username}</td>
                <td>{m.user.email}</td>
                <td>
                  <span className="text-xs">{m.user.role}</span>
                </td>
                <td>
                  {canManage ? (
                    <select
                      className="border rounded px-2 py-1"
                      value={m.role}
                      onChange={(e) => updateRole(m.user.id, e.target.value as any)}
                    >
                      <option>OWNER</option>
                      <option>MODERATOR</option>
                      <option>MADROLE</option>
                      <option>MEMBER</option>
                    </select>
                  ) : (
                    <span className="text-xs">{m.role}</span>
                  )}
                </td>
                <td>
                  {canManage ? (
                    <button
                      className="text-primary-600"
                      onClick={() => toggleActive(m.user.id, !m.isActive)}
                    >
                      {m.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  ) : m.isActive ? (
                    'oui'
                  ) : (
                    'non'
                  )}
                </td>
                <td>{m.role === 'MADROLE' && <span className="text-xs">✨</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  );
}
