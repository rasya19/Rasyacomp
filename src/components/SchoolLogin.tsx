const handleMagicLink = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage('');

  // cek data sekolah di Supabase
  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (!school) {
    setMessage("Sekolah tidak ditemukan.");
    setLoading(false);
    return;
  }

  if (school.status === 'pending') {
    setMessage("Pendaftaran sekolah masih menunggu persetujuan admin.");
    setLoading(false);
    return;
  }

  if (school.status === 'rejected') {
    setMessage("Pendaftaran sekolah ditolak admin.");
    setLoading(false);
    return;
  }

  // jika approved → login via magic link ke subdomain
  const redirect = `[${school.subdomain}.rasyatech.com](https://${school.subdomain}.rasyatech.com/admin)`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirect,
    },
  });

  if (error) {
    setMessage(`Error: ${error.message}`);
  } else {
    setMessage("Cek email Anda untuk magic link.");
  }

  setLoading(false);
};
