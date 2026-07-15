'use client';

import { useState } from 'react';
import { Contact } from '@/lib/types';
import { useLocalStorage } from './useLocalStorage';

export function useContacts() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('lefta_contacts', []);

  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [addContactError, setAddContactError] = useState('');

  return {
    contacts, setContacts,
    showAddContactForm, setShowAddContactForm,
    newContactName, setNewContactName,
    newContactRelation, setNewContactRelation,
    newContactAddress, setNewContactAddress,
    addContactError, setAddContactError,
  };
}
