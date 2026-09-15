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

  // Handle ESC key to close modal
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
      showAlert({ title: "Success", message: isEditing ? "User updated successfully" : "User created successfully", type: "success" });
    } else {
      showAlert({ title: "Error", message: "Failed to save user", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      title: "Delete User",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      type: "error",
      confirmText: "Delete",
      onConfirm: async () => {
        const res = await fetch(`/fcmm/api/users/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchUsers();
          showAlert({ title: "Deleted", message: "User has been deleted.", type: "success" });
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 border-2 border-zinc-200 dark:border-zinc-800 rounded-sm relative gap-4">
        <div>
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary-600"></div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">User Management</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono uppercase tracking-wider">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => {
            setFormData({ id: "", name: "", username: "", email: "", password: "", role: "USER" });
            setIsEditing(false);
            setShowModal(true);
          }}
          className="w-full md:w-auto flex justify-center items-center px-5 py-2.5 bg-primary-600 text-white font-bold rounded-sm border-2 border-primary-600 hover:bg-primary-700 hover:border-primary-700 transition-colors uppercase tracking-widest text-xs"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      <div 
        className="bg-transparent md:bg-white md:dark:bg-zinc-900 md:rounded-sm md:border-2 md:border-zinc-200 dark:border-zinc-800 relative md:overflow-x-auto"
      >
        {/* Desktop Table View */}
        <table className="hidden md:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-zinc-100 dark:bg-zinc-950">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{user.email || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(user)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                    <Trash2 className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {users.map((user) => (
            <div key={user.id} className="bg-white dark:bg-zinc-900 rounded-sm p-5 border-2 border-zinc-200 dark:border-zinc-800 relative">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{user.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
                  {user.email && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{user.email}</p>}
                </div>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                  {user.role}
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button onClick={() => handleOpenModal(user)} className="flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg text-sm font-semibold transition-colors">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button onClick={() => handleDelete(user.id)} className="flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-semibold transition-colors">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-zinc-900/80 animate-in fade-in duration-200" onClick={() => setShowModal(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="relative z-10 inline-block align-bottom bg-white dark:bg-zinc-900 rounded-sm text-left overflow-hidden shadow-md transform transition-all border-2 border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-zinc-200 dark:border-zinc-800">
                <form onSubmit={handleSubmit}>
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest" id="modal-title">
                        {isEditing ? "Edit User" : "Add User"}
                      </h3>
                      <button type="button" onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Name</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="block w-full px-4 py-2.5 border border-2 border-zinc-200 dark:border-zinc-800 rounded-sm focus:outline-none focus:border-primary-500 sm:text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors uppercase font-mono tracking-wider" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Username</label>
                        <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="block w-full px-4 py-2.5 border border-2 border-zinc-200 dark:border-zinc-800 rounded-sm focus:outline-none focus:border-primary-500 sm:text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors uppercase font-mono tracking-wider" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Email (Optional)</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="block w-full px-4 py-2.5 border border-2 border-zinc-200 dark:border-zinc-800 rounded-sm focus:outline-none focus:border-primary-500 sm:text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors uppercase font-mono tracking-wider" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Password <span className="text-gray-400 font-normal">{isEditing && "(Leave blank to keep current)"}</span></label>
                        <input type="password" required={!isEditing} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="block w-full px-4 py-2.5 border border-2 border-zinc-200 dark:border-zinc-800 rounded-sm focus:outline-none focus:border-primary-500 sm:text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors uppercase font-mono tracking-wider" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="block w-full px-4 py-2.5 border border-2 border-zinc-200 dark:border-zinc-800 rounded-sm focus:outline-none focus:border-primary-500 sm:text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors uppercase font-mono tracking-wider">
                          <option value="USER">User</option>
                          <option value="LEADER">Leader</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-950 px-6 py-4 flex flex-col md:flex-row-reverse gap-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button type="submit" className="w-full md:w-auto inline-flex justify-center rounded-xl border border-2 border-primary-600 px-6 py-2.5 bg-primary-600 text-xs uppercase tracking-widest font-black text-white hover:bg-primary-700 hover:border-primary-700 focus:outline-none transition-colors">
                      {isEditing ? 'Save Changes' : 'Create User'}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="w-full md:w-auto inline-flex justify-center rounded-xl border border-2 border-zinc-200 dark:border-zinc-800 px-6 py-2.5 bg-white dark:bg-zinc-900 text-xs uppercase tracking-widest font-black text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      
    </div>
  );
}
