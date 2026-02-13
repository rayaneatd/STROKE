import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

/**
 * Hook to synchronize external OAuth avatars (Google/Microsoft) to internal Supabase Storage.
 * This ensures we "own" the image and it follows standard signup logic.
 */
export const useAvatarSync = (currentUser: User | null | undefined) => {
    const isSyncing = useRef(false);

    useEffect(() => {
        const syncAvatar = async () => {
            if (!currentUser || !currentUser.id || !currentUser.avatarUrl) return;
            if (isSyncing.current) return;

            const url = currentUser.avatarUrl;
            
            // Check if it's an external URL (Google or Microsoft or Generic)
            // AND NOT already in our Supabase Storage
            const isExternal = !url.includes(supabase.storageUrl || 'supabase.co/storage') && 
                               (url.startsWith('https://lh3.googleusercontent.com') || // Google
                                url.startsWith('https://graph.microsoft.com') || // Microsoft Graph
                                url.includes('githubusercontent') || 
                                url.includes('licdn.com')); // LinkedIn

            if (isExternal) {
                isSyncing.current = true;
                console.log('Detected external avatar, syncing to internal storage...', url);

                try {
                    // 1. Fetch the image
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Failed to fetch external avatar');
                    const blob = await response.blob();

                    // 2. Upload to Supabase Storage
                    // Use a standard name like "oauth_sync_{timestamp}.jpg"
                    const fileExt = blob.type.split('/')[1] || 'jpg';
                    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
                    const filePath = `${currentUser.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, blob, { 
                            upsert: true,
                            contentType: blob.type 
                        });

                    if (uploadError) throw uploadError;

                    // 3. Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    // 4. Update Profile
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ avatar_url: publicUrl })
                        .eq('id', currentUser.id);

                    if (updateError) throw updateError;

                    console.log('Avatar successfully synced to:', publicUrl);

                    // Optional: Reload page or Invalidate queries? 
                    // Since this happens quietly, we might not need to force a refresh immediately,
                    // but the next fetch will get the new URL.
                    
                } catch (err) {
                    console.error('Error syncing avatar:', err);
                } finally {
                    isSyncing.current = false;
                }
            }
        };

        syncAvatar();
    }, [currentUser?.id, currentUser?.avatarUrl]);
};
