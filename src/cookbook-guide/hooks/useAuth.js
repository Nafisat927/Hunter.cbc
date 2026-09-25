import { useEffect, useState } from 'react';
import { sbClient } from '../lib/supabaseClient';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    sbClient.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user || null);
      setAuthLoading(false);
    });

    const { data: listener } = sbClient.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await sbClient.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    const { data } = await sbClient.auth.getUser();
    setCurrentUser(data.user);
    return null;
  };

  const logout = async () => {
    await sbClient.auth.signOut();
    setCurrentUser(null);
  };

  const updateProfile = async (fields) => {
    const { data, error } = await sbClient.auth.updateUser({ data: fields });
    if (error) return error.message;
    setCurrentUser(data.user);
    return null;
  };

  return { currentUser, authLoading, login, logout, updateProfile };
}
