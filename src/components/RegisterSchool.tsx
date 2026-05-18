import React, { useState } from 'react';

export default function RegisterSchool() {
  const [form, setForm] = useState({
    school_name: '',
    admin_email: '',
    email: '',
    phone: '',
    alamat: '',
    subdomain: ''
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus('Mengirim...');

    const res = await fetch('/api/createSchool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const result = await res.json();

    if (result.error) setStatus('Gagal: ' + result.error);
    else setStatus('Pendaftaran berhasil! Menunggu approval admin.');
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Daftar Sekolah</h1>

      <input name="school_name" placeholder="Nama Sekolah" onChange={handleChange} className="input" />
      <input name="admin_email" placeholder="Email Admin Sekolah" onChange={handleChange} className="input" />
      <input name="email" placeholder="Email Sekolah" onChange={handleChange} className="input" />
      <input name="phone" placeholder="Nomor Telepon" onChange={handleChange} className="input" />
      <input name="alamat" placeholder="Alamat" onChange={handleChange} className="input" />
      <input name="subdomain" placeholder="Subdomain" onChange={handleChange} className="input" />

      <button className="btn-primary">Daftar</button>
      <p>{status}</p>
    </form>
  );
}
