"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useAlert } from "@/components/AlertProvider";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", username: "", email: "", password: "", role: "USER" });
  const [isEditing, setIsEditing] = useState(false);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  const fetchUsers = async () => {
    const res = await fetch("/fcmm/api/users");
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const handleOpenModal = (user?: any) => {
    if (user) {
      setFormData({ id: user.id, name: user.name, username: user.username, email: user.email || "", password: "", role: user.role });
      setIsEditing(true);
    } else {
      setFormData({ id: "", name: "", username: "", email: "", password: "", role: "USER" });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `/fcmm/api/users/${formData.id}` : "/fcmm/api/users";
    const method = isEditing ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setShowModal(false);
      fetchUsers();
      showAlert({ title: "Berhasil", message: isEditing ? "Pengguna berhasil diperbarui." : "Pengguna berhasil ditambahkan.", type: "success" });
    } else {
      showAlert({ title: "Gagal", message: "Terjadi kesalahan saat menyimpan pengguna.", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      title: "Hapus Pengguna",
      message: "Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.",
      type: "error",
      confirmText: "Hapus",
      onConfirm: async () => {
        const res = await fetch(`/fcmm/api/users/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchUsers();
          showAlert({ title: "Dihapus", message: "Pengguna telah berhasil dihapus.", type: "success" });
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="page-header">
        <div>
          <h1>Manajemen Pengguna</h1>
          <p>Kelola data dan peran pengguna sistem</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Tambah Pengguna
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Pengguna</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td data-label="Nama Pengguna">
                  <span className="font-semibold">{user.name}</span>
                </td>
                <td data-label="Username">
                  <span className="text-[var(--text-secondary)]">@{user.username}</span>
                </td>
                <td data-label="Email">
                  <span className="text-[var(--text-secondary)]">{user.email || "-"}</span>
                </td>
                <td data-label="Role">
                  <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${user.role === 'ADMIN' ? 'bg-[var(--primary-500)]/10 text-[var(--primary-500)]' : 'bg-[var(--success-500)]/10 text-[var(--success-500)]'}`}>
                    {user.role}
                  </span>
                </td>
                <td data-label="Aksi" className="md:text-right">
                  <div className="flex items-center md:justify-end gap-3 mt-2 md:mt-0">
                    <button onClick={() => handleOpenModal(user)} className="flex items-center px-4 md:px-0 py-2 md:py-0 text-[var(--primary-500)] hover:text-[var(--primary-600)] bg-[var(--bg-color)] md:bg-transparent rounded-lg text-sm font-semibold transition-colors">
                      <Edit className="w-4 h-4 md:mr-0 mr-2" />
                      <span className="md:hidden">Edit</span>
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="flex items-center px-4 md:px-0 py-2 md:py-0 text-[var(--danger-500)] hover:text-[var(--danger-600)] bg-[var(--bg-color)] md:bg-transparent rounded-lg text-sm font-semibold transition-colors">
                      <Trash2 className="w-4 h-4 md:mr-0 mr-2" />
                      <span className="md:hidden">Hapus</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full md:max-w-md bg-[var(--bg-card)] rounded-t-[32px] md:rounded-3xl p-6 md:p-8 animate-slide-up-sheet md:animate-in md:zoom-in-95 shadow-2xl">
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-6 md:hidden"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-[var(--text-primary)]">
                {isEditing ? "Edit Pengguna" : "Tambah Pengguna"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-[var(--text-secondary)] hover:bg-[var(--bg-color)] p-2 rounded-full transition-colors hidden md:block">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Email (Opsional)</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Password {isEditing && <span className="text-[10px] font-normal italic">(Kosongkan jika tidak diubah)</span>}</label>
                <input type="password" required={!isEditing} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Peran (Role)</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="form-control">
                  <option value="USER">User</option>
                  <option value="LEADER">Leader</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="pt-4 flex flex-col md:flex-row-reverse gap-3">
                <button type="submit" className="w-full md:w-auto btn-primary flex-1">
                  {isEditing ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full md:w-auto px-6 py-3 bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-semibold rounded-full transition-colors flex-1">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
