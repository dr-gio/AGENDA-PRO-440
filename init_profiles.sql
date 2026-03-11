DO $$
BEGIN
  -- Admin Profile
  INSERT INTO public.profiles (id, email, name, role)
  SELECT id, email, 'Dr. Gio', 'admin'
  FROM auth.users 
  WHERE email = 'drgio@440clinic.com'
  ON CONFLICT (id) DO UPDATE SET role = 'admin', name = 'Dr. Gio';

  -- Reception Profile
  INSERT INTO public.profiles (id, email, name, role)
  SELECT id, email, 'Recepción', 'reception'
  FROM auth.users 
  WHERE email = 'recepcion@440clinic.com'
  ON CONFLICT (id) DO UPDATE SET role = 'reception', name = 'Recepción';
END $$;
