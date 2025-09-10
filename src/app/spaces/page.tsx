'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import PageLayout from '@/app/components/ui/PageLayout';
import PageHeader from '@/app/components/ui/PageHeader';
import { useSpace } from '@/app/components/providers/SpaceProvider';
import { fetch as signedFetch, patchSpaceMember } from '@/utils/api-client';

type SpaceRow = {
  id: string;
  name: string;
  description?: string | null;
  status: 'REJECTED' | 'ACTIVE' | 'REQUESTED' | 'LOCKED' | 'PENDING';
  createdAt?: string;
  updatedAt?: string;
  // optionnel côté serveur: ownerId, etc.
};

type MemberRow = {
  user: { id: string; username: string; email: string; role: string };
  role: 'OWNER' | 'MODERATOR' | 'MADROLE' | 'MEMBER';
  isActive: boolean;
};

type TabKey = 'mine' | 'create' | 'admin';

export default function SpacesPage() {
  const { spaces, current, setCurrent, role } = useSpace();

  // Onglets
  const [tab, setTab] = useState<TabKey>('mine');

  // ---- Onglet "Créer un espace" ----
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmitCreate = useCallback(async () => {
    const payload = { name: name.trim(), description: desc };
    if (!payload.name) {
      setSubmitMsg('Le nom est requis.');
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await signedFetch('/api/spaces', 'POST', payload);
      const d = await res.json();
      if (res.ok) {
        setSubmitMsg('✅ Demande envoyée, en attente de validation.');
        setName('');
        setDesc('');
        // (Optionnel) rafraîchir plus tard: si ton SpaceProvider expose un refresh(), appelle-le ici.
      } else {
        setSubmitMsg(d?.error || 'Erreur lors de la demande.');
      }
    } catch (e: any) {
      setSubmitMsg('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  }, [name, desc]);

  // ---- Onglet "Admin": validations & membres ----
  const [pending, setPending] = useState<SpaceRow[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);

  // Sélecteur d’espace pour la gestion des membres (admin/owner/moderator)
  const [manageSpaceId, setManageSpaceId] = useState<string | undefined>(current?.id);
  useEffect(() => {
    // synchroniser par défaut sur l’espace courant
    setManageSpaceId(current?.id);
  }, [current?.id]);

  const manageSpace = useMemo(
    () => spaces.find((s) => s.id === manageSpaceId) || null,
    [manageSpaceId, spaces],
  );

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const canManageMembers = role === 'OWNER' || role === 'MODERATOR' || role === 'MADROLE'; // rôle dans l’espace courant

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    setPendingError(null);
    try {
      // On tente deux variantes d’API pour rester compatible:
      // 1) /api/spaces?pending=1
      let res = await signedFetch('/api/spaces?pending=1', 'GET');
      if (!res.ok) {
        // 2) fallback: /api/spaces?status=REQUESTED
        res = await signedFetch('/api/spaces?status=REQUESTED', 'GET');
      }
      if (!res.ok) {
        const err = await res.text();
        // 403 = pas admin -> on masque calmement le panneau "Demandes"
        if (res.status === 403) {
          setPending([]);
          setPendingError(null);
        } else {
          setPendingError(err || 'Erreur lors du chargement des demandes.');
        }
        setPending([]);
        return;
      }
      const data = await res.json();
      // on accepte data.spaces ou data.items ou data selon ton backend
      const list: SpaceRow[] = data?.spaces || data?.items || data || [];
      setPending(list.filter((s) => s.status === 'PENDING' || s.status === 'REQUESTED'));
    } catch (e: any) {
      setPendingError('Erreur réseau.');
      setPending([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const approveSpace = useCallback(
    async (id: string) => {
      // 1) tentative REST "propre"
      let res = await signedFetch(`/api/spaces/${id}`, 'PATCH', { status: 'ACTIVE' });

      // 2) fallback si 404 (route dynamique absente)
      if ((res as any)?.status === 404) {
        res = await signedFetch(`/api/spaces`, 'PATCH', { id, status: 'ACTIVE' });
      }

      const ok =
        (res as any)?.ok === true ||
        (typeof (res as any)?.status === 'number' &&
          (res as any).status >= 200 &&
          (res as any).status < 300);

      if (!ok) {
        try {
          const j = (res as any)?.data ?? (await (res as any)?.json?.());
          alert(j?.error || 'Erreur approbation.');
        } catch {
          const t = await (res as any)?.text?.();
          alert(t || 'Erreur approbation.');
        }
        return;
      }

      loadPending();
    },
    [loadPending],
  );

  const rejectSpace = useCallback(
    async (id: string) => {
      let res = await signedFetch(`/api/spaces/${id}`, 'PATCH', { status: 'REJECTED' });

      if ((res as any)?.status === 404) {
        res = await signedFetch(`/api/spaces`, 'PATCH', { id, status: 'REJECTED' });
      }

      const ok =
        (res as any)?.ok === true ||
        (typeof (res as any)?.status === 'number' &&
          (res as any).status >= 200 &&
          (res as any).status < 300);

      if (!ok) {
        try {
          const j = (res as any)?.data ?? (await (res as any)?.json?.());
          alert(j?.error || 'Erreur rejet.');
        } catch {
          const t = await (res as any)?.text?.();
          alert(t || 'Erreur rejet.');
        }
        return;
      }

      loadPending();
    },
    [loadPending],
  );

  const loadMembers = useCallback(async () => {
    if (!manageSpaceId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    setMembersError(null);
    try {
      const res = await signedFetch(
        `/api/spaces/${manageSpaceId}/members?spaceId=${manageSpaceId}`,
        'GET',
      );
      if (!res.ok) {
        const err = await res.text();
        setMembersError(err || 'Erreur chargement membres.');
        setMembers([]);
        return;
      }
      const data = await res.json();
      setMembers(data.members || []);
    } catch (e: any) {
      setMembersError('Erreur réseau.');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [manageSpaceId]);

  useEffect(() => {
    if (tab === 'admin') {
      loadPending();
      loadMembers();
    }
  }, [tab, loadPending, loadMembers]);

  const onChangeRole = async (userId: string, newRole: MemberRow['role']) => {
    if (!manageSpaceId) return;
    const res = await patchSpaceMember(manageSpaceId, { userId, role: newRole });
    if ((res as any)?.ok === false) {
      alert('Mise à jour du rôle refusée.');
    }
    loadMembers();
  };

  const onToggleActive = async (userId: string, isActive: boolean) => {
    if (!manageSpaceId) return;
    const res = await patchSpaceMember(manageSpaceId, { userId, isActive });
    if ((res as any)?.ok === false) {
      alert('Mise à jour du statut refusée.');
    }
    loadMembers();
  };

  return (
    <PageLayout>
      <PageHeader title="Espaces" icon="🌐" />

      {/* Onglets */}
      <div className="mb-4">
        <div className="inline-flex w-full sm:w-auto bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-1 shadow-sm">
          <TabButton label="Mes espaces" active={tab === 'mine'} onClick={() => setTab('mine')} />
          <TabButton
            label="Créer un espace"
            active={tab === 'create'}
            onClick={() => setTab('create')}
          />
          <TabButton
            label="Administration"
            active={tab === 'admin'}
            onClick={() => setTab('admin')}
          />
        </div>
      </div>

      {/* Panneaux */}
      {tab === 'mine' && (
        <section className="space-y-6">
          <Card title="Mes espaces" subtitle="Accédez rapidement à vos slang-spaces.">
            <ul className="divide-y">
              {spaces.map((s) => (
                <li
                  key={s.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      Statut&nbsp;: <span className="uppercase">{s.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition"
                      href={`/spaces/${s.id}`}
                    >
                      Ouvrir
                    </a>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition"
                      onClick={() => {
                        setCurrent(s.id);
                        setManageSpaceId(s.id);
                        setTab('admin');
                      }}
                    >
                      Gérer les membres
                    </button>
                  </div>
                </li>
              ))}
              {spaces.length === 0 && (
                <li className="py-6 text-center text-gray-500">Aucun espace pour l’instant.</li>
              )}
            </ul>
          </Card>

          <Card title="Demande rapide" subtitle="Créer un espace en un clic.">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Nom de l'espace"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Description (optionnel)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <button
                onClick={onSubmitCreate}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white 
                           hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50"
              >
                {submitting ? 'Envoi…' : 'Demander la création'}
              </button>
              {submitMsg && <p className="text-sm mt-2 text-gray-700">{submitMsg}</p>}
            </div>
          </Card>
        </section>
      )}

      {tab === 'create' && (
        <section className="space-y-6">
          <Card
            title="Demander la création d’un espace"
            subtitle="Un administrateur devra valider votre demande."
          >
            <div className="space-y-3">
              <input
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Nom de l'espace"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                placeholder="Description (optionnel)"
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <div>
                <button
                  onClick={onSubmitCreate}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50"
                >
                  {submitting ? 'Envoi…' : 'Demander la création'}
                </button>
                {submitMsg && <p className="text-sm mt-2 text-gray-700">{submitMsg}</p>}
              </div>
            </div>
          </Card>
        </section>
      )}

      {tab === 'admin' && (
        <section className="space-y-6">
          {/* Bloc demandes d’espaces (visible si autorisé côté API) */}
          <Card title="Demandes d’espaces" subtitle="Validez ou rejetez les créations d’espaces.">
            {pendingLoading ? (
              <Loader label="Chargement des demandes…" />
            ) : pendingError ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {pendingError}
              </div>
            ) : pending.length === 0 ? (
              <div className="text-sm text-gray-500">Aucune demande en attente.</div>
            ) : (
              <ul className="divide-y">
                {pending.map((s) => (
                  <li
                    key={s.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{s.name}</div>
                      <div className="text-xs text-gray-500">
                        Statut&nbsp;: <span className="uppercase">{s.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveSpace(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                        title="Approuver"
                      >
                        ✅ Approuver
                      </button>
                      <button
                        onClick={() => rejectSpace(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition"
                        title="Rejeter"
                      >
                        🗑️ Rejeter
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Bloc gestion des membres */}
          <Card
            title="Gestion des membres"
            subtitle="Administrateur, owner ou modérateur peuvent gérer les membres de l’espace."
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Espace</span>
                <select
                  className="text-sm border rounded-md px-2 py-1 bg-white"
                  value={manageSpaceId || ''}
                  onChange={(e) => setManageSpaceId(e.target.value)}
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.status !== 'ACTIVE' ? `(${s.status.toLowerCase()})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1" />
              <button
                onClick={loadMembers}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition text-sm"
              >
                Rafraîchir
              </button>
            </div>

            {membersLoading ? (
              <Loader label="Chargement des membres…" />
            ) : membersError ? (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {membersError}
              </div>
            ) : members.length === 0 ? (
              <div className="text-sm text-gray-500">Aucun membre pour cet espace.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-3">Utilisateur</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Rôle global</th>
                      <th className="py-2 pr-3">Rôle espace</th>
                      <th className="py-2 pr-3">Actif</th>
                      <th className="py-2 pr-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.user.id} className="border-t">
                        <td className="py-2 pr-3">{m.user.username}</td>
                        <td className="py-2 pr-3">{m.user.email}</td>
                        <td className="py-2 pr-3">
                          <span className="text-xs">{m.user.role}</span>
                        </td>
                        <td className="py-2 pr-3">
                          {canManageMembers ? (
                            <select
                              className="border rounded px-2 py-1"
                              value={m.role}
                              onChange={(e) =>
                                onChangeRole(m.user.id, e.target.value as MemberRow['role'])
                              }
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
                        <td className="py-2 pr-3">
                          {canManageMembers ? (
                            <button
                              className="text-primary-600"
                              onClick={() => onToggleActive(m.user.id, !m.isActive)}
                            >
                              {m.isActive ? 'Désactiver' : 'Activer'}
                            </button>
                          ) : m.isActive ? (
                            'oui'
                          ) : (
                            'non'
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {m.role === 'MADROLE' && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                              ✨ MAD
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      )}
    </PageLayout>
  );
}

/* -------------------------- UI helpers alignés -------------------------- */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all transform',
        active
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md scale-105'
          : 'text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:shadow-sm',
      )}
    >
      {label}
    </button>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Loader({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      <span>{label || 'Chargement…'}</span>
    </div>
  );
}
