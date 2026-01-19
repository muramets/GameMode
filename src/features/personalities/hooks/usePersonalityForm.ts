import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePersonalityStore } from '../../../stores/personalityStore';

interface UsePersonalityFormProps {
    personalityId: string | null;
    onClose: () => void;
    isOpen: boolean;
}

export function usePersonalityForm({ personalityId, onClose, isOpen }: UsePersonalityFormProps) {
    const { user } = useAuth();
    const { personalities, updatePersonality, deletePersonality, addPersonality, switchPersonality } = usePersonalityStore();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('user');
    const [color, setColor] = useState('#e2b714');
    const [avatar, setAvatar] = useState(''); // URL for avatar

    // UI State
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize/Reset Form
    const prevIsOpen = useRef(isOpen);
    const prevId = useRef(personalityId);

    // Initialize/Reset Form
    useEffect(() => {
        const hasOpened = isOpen && !prevIsOpen.current;
        const idChanged = personalityId !== prevId.current;

        if (isOpen && (hasOpened || idChanged)) {
            if (personalityId) {
                const p = personalities.find(p => p.id === personalityId);
                if (p) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setName(p.name);
                    setDescription(p.description || '');
                    setIcon(p.icon || 'user');
                    setColor(p.iconColor || '#e2b714');
                    setAvatar(p.avatar || '');
                }
            } else {
                // New Mode
                setName('');
                setDescription('');
                setIcon('user');
                setColor('#e2b714');
                setAvatar('');
            }
            setIsConfirmingDelete(false);
            setTempImage(null);
            setIsCropping(false);
        }

        prevIsOpen.current = isOpen;
        prevId.current = personalityId;
    }, [isOpen, personalityId, personalities]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        const data = {
            name,
            description,
            icon,
            iconColor: color,
            avatar
        };

        try {
            if (personalityId) {
                await updatePersonality(user.uid, personalityId, data);
            } else {
                const newId = await addPersonality(user.uid, name, data);
                await switchPersonality(user.uid, newId);
            }
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!personalityId || !user) return;

        if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);
            setTimeout(() => setIsConfirmingDelete(false), 3000);
            return;
        }

        await deletePersonality(user.uid, personalityId);
        onClose();
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setIsCropping(true);
            };
            reader.readAsDataURL(file);
            // Reset input so same file can be selected again
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBase64: string) => {
        setAvatar(croppedBase64);
        setIsCropping(false);
        setTempImage(null);
    };

    const handleCancelCrop = () => {
        setIsCropping(false);
        setTempImage(null);
    };

    return {
        formState: {
            name, setName,
            description, setDescription,
            icon, setIcon,
            color, setColor,
            avatar, setAvatar
        },
        uiState: {
            isConfirmingDelete,
            isCropping,
            tempImage
        },
        refs: {
            fileInputRef
        },
        handlers: {
            handleSubmit,
            handleDelete,
            handleFileSelect,
            handleCropComplete,
            handleCancelCrop
        }
    };
}
