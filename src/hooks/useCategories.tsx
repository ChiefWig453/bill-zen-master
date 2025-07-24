import { useState, useEffect } from 'react';
import { BILL_CATEGORIES } from '@/types/bill';
import { useAuth } from '@/hooks/useAuth';

export const useCategories = () => {
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`customCategories_${user.id}`);
      if (saved) {
        setCustomCategories(JSON.parse(saved));
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && customCategories.length > 0) {
      localStorage.setItem(`customCategories_${user.id}`, JSON.stringify(customCategories));
    }
  }, [customCategories, user]);

  const addCustomCategory = (category: string) => {
    const trimmedCategory = category.trim();
    if (trimmedCategory && !allCategories.includes(trimmedCategory)) {
      setCustomCategories(prev => [...prev, trimmedCategory]);
      return true;
    }
    return false;
  };

  const allCategories = [...BILL_CATEGORIES, ...customCategories];

  return {
    allCategories,
    customCategories,
    addCustomCategory
  };
};