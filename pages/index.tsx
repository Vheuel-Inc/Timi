import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { useDomains, useUser } from '../utils/hooks';
import Select from '../components/Select';

const MAX_USERNAMES = 5;

export default function Index() {
    const domains = useDomains();
    const domainsList = Object.keys(domains);
    const { user, fetchUser, credentials, logout } = useUser();

    const [usernames, setUsernames] = useState(null);
    const [subdomain, setSubdomain] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');

    const username = useMemo(() => [subdomain, selectedDomain].join('.').toLowerCase(), [subdomain, selectedDomain]);
    const [confirmed, setConfirmed] = useState(false);
    const [isRegistering, setRegistering] = useState(false);
    const [setAsPrimaryUsername, setSetAsPrimaryUsername] = useState(true);
    const [releasingUsernameId, setReleasingUsername] = useState('');
    const [switchingToUsernameId, setSwitchingToUsernameId] = useState('');

    const [available, setAvailable] = useState(false);
    const [isCheckingAvailability, setCheckingAvailability] = useState(false);
    const checkAvailabilityTimeoutRef = useRef(null);

    const isUsernameValid = useMemo(() => subdomain.length > 0 && selectedDomain.length > 0, [subdomain, selectedDomain]);

    const defaultUsername = useMemo(() => usernames?.[0]?.previousUsername || user?.handle, [usernames, user]);

    const fetchUsernames = useCallback(async () => {
        try {
            const { data: usernames } = await axios.get('/api/list', {
                headers: {
                    Authorization: `Bearer ${credentials.accessToken}`
                }
            });
            setUsernames(usernames);
        } catch (error) {
            console.error('Error fetching usernames:', error);
        }
    }, [credentials]);

    const checkUsername = useCallback(async () => {
        if (checkAvailabilityTimeoutRef.current) {
            clearTimeout(checkAvailabilityTimeoutRef.current);
        }

        if (!isUsernameValid) return;

        setCheckingAvailability(true);

        checkAvailabilityTimeoutRef.current = setTimeout(async () => {
            try {
                const { data } = await axios.post('/api/check', { username });

                setAvailable(data.available);
            } catch (error) {
                console.error('Error checking username availability:', error);
            } finally {
                setCheckingAvailability(false);
            }
        }, 500);
    }, [username, isUsernameValid]);

    useEffect(() => {
        fetchUsernames();
    }, [fetchUsernames]);

    useEffect(() => {
        checkUsername();
    }, [username, checkUsername]);

    const registerUsername = useCallback(async () => {
        if (!isUsernameValid || !confirmed || isRegistering || isCheckingAvailability) return;

        setRegistering(true);

        try {
            const response = await axios.post('/api/register', {
                username,
                setAsPrimary: setAsPrimaryUsername,
            }, {
                headers: {
                    Authorization: `Bearer ${credentials.accessToken}`,
                },
            });

            if (response.data.success) {
                fetchUsernames(); // Refresh daftar usernames
                setSubdomain('');
                setSelectedDomain('');
                setConfirmed(false);
            } else {
                console.error('Gagal mendaftarkan username');
            }
        } catch (error) {
            console.error('Terjadi kesalahan selama registrasi:', error);
        } finally {
            setRegistering(false);
        }
    }, [username, setAsPrimaryUsername, isUsernameValid, confirmed, isRegistering, isCheckingAvailability, credentials.accessToken, fetchUsernames]);

    return (
        <div>
            <h1>Daftarkan Username</h1>
            <Input 
                value={subdomain}
                onChange={e => setSubdomain(e.target.value)}
                placeholder="Subdomain"
            />
            <Select 
                options={domainsList}
                value={selectedDomain}
                onChange={e => setSelectedDomain(e.target.value)}
                placeholder="Domain"
            />
            <div>
                <p>
                    Kami akan melakukan segala upaya untuk terus menghosting handle Anda di infrastruktur kami secara gratis selama kami bisa. Namun, tidak ada jaminan bahwa nama pengguna akan bertahan selamanya. Jika handle atau layanan Anda hilang, Anda selalu dapat mengubah nama pengguna Anda kembali di aplikasi Bluesky.
                </p>
                <div className="flex items-start mb-1">
                    <input className="mt-[5px]" type="checkbox" checked={confirmed} onChange={e => setConfirmed(_confirmed => !_confirmed)} />
                    <p className="ml-2 cursor-default" onClick={() => setConfirmed(_confirmed => !_confirmed)}>
                        Saya menyadari dengan mendaftarkan <b>{username}</b> di <span className="text-blue-400">BIRU</span> dan mengklik tombol di bawah, saya mungkin kehilangan handle yang saya gunakan saat ini secara permanen, dan saya tidak dijamin akan menyimpan handle {username} selamanya.
                    </p>
                </div>
            </div>
            <Button 
                className="w-full" 
                onClick={registerUsername} 
                disabled={!available || !isUsernameValid || !confirmed || isRegistering || isCheckingAvailability}
            >
                {isCheckingAvailability ? (
                    `Cek ketersediaan untuk ${username}...`
                ) : (
                    isRegistering ? (
                        `Mendaftarkan ${username}...`
                    ) : (
                        isUsernameValid ? (
                            available ? (
                                `Daftarkan ${username}`
                            ) : (
                                'Handle tidak tersedia'
                            )
                        ) : (
                            'Pilih subdomain dan domain'
                        )
                    )
                )}
            </Button>
        </div>
    );
}
