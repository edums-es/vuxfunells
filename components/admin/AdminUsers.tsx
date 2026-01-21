import React, { useState, useEffect } from 'react';
import { adminListUsers, adminCreateUser, adminDeleteUser, AdminUserFull } from '../../lib/api';
import { Plus, Trash2, Search, Shield, ShieldAlert, ShieldCheck, Mail, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';

// Helper components
const Badge = ({ role }: { role: string }) => {
  const styles = {
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    editor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    viewer: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
  };
  
  const icons = {
    admin: ShieldAlert,
    editor: ShieldCheck,
    viewer: Shield
  };

  const Icon = icons[role as keyof typeof icons] || Shield;

  return (
    <span className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
      styles[role as keyof typeof styles] || styles.viewer
    )}>
      <Icon className="w-3 h-3" />
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'viewer' });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminListUsers();
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreateLoading(true);
    try {
      await adminCreateUser(formData);
      setIsCreateOpen(false);
      setFormData({ email: '', password: '', role: 'viewer' });
      loadUsers();
    } catch (err) {
      setError('Erro ao criar usuário. Verifique se o email já existe.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      await adminDeleteUser(id);
      loadUsers();
    } catch (err) {
      alert('Erro ao deletar usuário');
    }
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-neutral-950 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Usuários & Acessos</h1>
              <p className="text-neutral-400 mt-2">Gerencie quem tem acesso ao painel administrativo.</p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/20 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Novo Usuário
            </button>
          </div>

          {/* List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-20 text-neutral-500 animate-pulse">Carregando usuários...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 bg-neutral-900/30 rounded-2xl border border-white/5">
                Nenhum usuário encontrado além de você.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center border border-white/5">
                      <User className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white text-lg">{user.email}</span>
                        <Badge role={user.role} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Ativo
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-3 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors self-end md:self-center"
                    title="Remover usuário"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            onClick={() => setIsCreateOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300"
          >
              <h2 className="text-2xl font-bold text-white mb-6">Novo Usuário</h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                      placeholder="exemplo@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Senha</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Nível de Acesso</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['viewer', 'editor', 'admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={cn(
                          "py-2.5 px-2 rounded-xl text-sm font-medium border transition-all",
                          formData.role === r
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "bg-neutral-950 border-white/10 text-neutral-400 hover:border-white/20"
                        )}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? 'Criando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
