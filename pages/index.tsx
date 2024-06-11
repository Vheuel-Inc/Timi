import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import axios from 'axios'

import Input from '../components/Input'
import Button from '../components/Button'

import { useDomains, useUser } from '../utils/hooks'
import Select from '../components/Select'

const MAX_USERNAMES = 5

export default function Index() {
    const domains = useDomains()
    const domainsList = Object.keys(domains)
    const { user, fetchUser, credentials, logout } = useUser()

    const [usernames, setUsernames] = useState(null)

    const [subdomain, setSubdomain] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('')

    const username = useMemo(() => [subdomain, selectedDomain].join('.').toLowerCase(), [subdomain, selectedDomain])
    const [confirmed, setConfirmed] = useState(false)
    const [isRegistering, setRegistering] = useState(false)
    const [setAsPrimaryUsername, setSetAsPrimaryUsername] = useState(true)
    const [releasingUsernameId, setReleasingUsername] = useState('')
    const [switchingToUsernameId, setSwitchingToUsernameId] = useState('')

    /**
     * Username Availability
     */
    const [available, setAvailable] = useState(false)
    const [isCheckingAvailability, setCheckingAvailability] = useState(false)
    const checkAvailabilityTimeoutRef = useRef(null)

    const isUsernameValid = useMemo(() => subdomain.length > 0 && selectedDomain.length > 0, [subdomain, selectedDomain])

    /**
     * Default Username
     */
    const defaultUsername = useMemo(() => usernames?.[0]?.previousUsername || user?.handle, [usernames, user])

    const fetchUsernames = useCallback(async () => {
        try {
            const { data: usernames } = await axios.get('/api/list', {
                headers: {
                    Authorization: `Bearer ${credentials.accessToken}`
                }
            })

            setUsernames(usernames)
        } catch {

        }
    }, [credentials])

    const checkUsername = useCallback(async () => {
        setCheckingAvailability(true)

        try {
            const { data } = await axios.post('/api/check', {
                subdomain,
                domain: selectedDomain
            }, {
                headers: {
                    Authorization: `Bearer ${credentials.accessToken}`
                }
            })

            setAvailable(data.available)
        } catch {

        }

        setCheckingAvailability(false)
    }, [subdomain, selectedDomain, credentials, setAvailable, setCheckingAvailability])

    useEffect(() => {
        if (subdomain.length === 0 || selectedDomain.length === 0) {
            setCheckingAvailability(false)

            return
        }

        setCheckingAvailability(true)

        if (checkAvailabilityTimeoutRef.current) {
            clearTimeout(checkAvailabilityTimeoutRef.current)
            checkAvailabilityTimeoutRef.current = null
        }

        checkAvailabilityTimeoutRef.current = setTimeout(checkUsername, 500)
    }, [subdomain, selectedDomain])

    const registerUsername = useCallback(async () => {
        setRegistering(true)

        try {
            await axios.post('/api/register', {
                domain: selectedDomain,
                subdomain,
                setAsPrimaryUsername
            }, {
                headers: {
                    Authorization: `Bearer ${credentials.accessToken}`
                }
            })

            setConfirmed(false)
            setSetAsPrimaryUsername(true)

            setSubdomain('')
            setSelectedDomain('')

            await fetchUser() // also calls fetchUsernames
            window.location.reload() // Refresh the page
        } catch {

        }

        setRegistering(false)
    }, [subdomain, selectedDomain, credentials])

    const switchToUsername = useCallback(async (id) => {
        setSwitchingToUsernameId(id)

        try {
            await axios.post('/api/switch', {
                id
            }, {
                headers: {
                    Authorization: `Bearer ${credentials.accessToken}`
                }
            })

            fetchUser() // also calls fetchUsernames
        } catch {

        }

        setSwitchingToUsernameId('')
    }, [credentials, setSwitchingToUsernameId])

    const releaseUsername = useCallback(async (id) => {
        setReleasingUsername(id)

        try {
            await axios.post('/api/release', {
                id
            }, {
                headers: {
                    Authorization: `Bearer ${credentials.accessToken}`
                }
            })

            // Remove username
            setUsernames(usernames => usernames.filter(username => username.id !== id))
            fetchUser() // also calls fetchUsernames
        } catch {

        }

        setReleasingUsername('')
    }, [credentials, fetchUsernames, setReleasingUsername])

    useEffect(() => {
        if (!user)
            return

        fetchUsernames()
    }, [user])

    if (!user)
        return <></>

    const usernameOwner = domains[selectedDomain]

    return (
        <div className="w-screen h-screen flex flex-col items-center px-3 py-2 my-5">
            <div className="flex flex-col mx-5 md:w-1/2 xl:w-1/3 overflow-scroll">
                <div className="mx-3 my-2 flex flex-row mb-5">
                    <div>
                        <p className="text-3xl text-blue-100 font-bold">BIRU</p>
                        <p>Handle unik dan gratis untuk Bluesky</p>
                    </div>
                    <div className="flex-grow" />
                    <img src={user.avatar} className="h-10 rounded-full cursor-pointer" onClick={() => {
                        if (!confirm('Keluarkan Akun?'))
                            return

                        logout()
                    }} />
                </div>
                {defaultUsername && (
                    <div className={`bg-black/5 px-3 py-2 mb-2`}>
                        <p className="text-lg">{defaultUsername}</p>
                        <p className="text-sm">Handle saat ini</p>
                        <p className="text-sm">{defaultUsername === user.handle ? <a className="text-green-300">Aktif</a> : <a className={`font-semibold ${!!switchingToUsernameId ? 'cursor-not-allowed opacity-25' : 'hover:underline cursor-pointer text-blue-300'} ${switchingToUsernameId === 'default' ? 'cursor-wait' : ''}`} onClick={() => !!switchingToUsernameId ? {} : switchToUsername('default')}>{switchingToUsernameId === 'default' ? 'Mengganti...' : 'Tetapkan sebagai utama'}</a>}</p>
                    </div>
                )}
                <div className="bg-black/5 px-5 py-3 mb-3">
                    <p className="text-xl font-bold mb-2">Handle dimiliki ({usernames?.length || 0}/{MAX_USERNAMES})</p>
                    {usernames ? (
                        <>
                            {usernames.length > 0 ? (
                                <>
                                    {usernames.map((username, i) => {
                                        const isReleasingUsername = username.id === releasingUsernameId
                                        const isReleasingSomeUsername = !!releasingUsernameId

                                        const isSwitchingToUsername = username.id === switchingToUsernameId
                                        const isSwitchingToSomeUsername = !!switchingToUsernameId

                                        const isLastUsername = i === usernames.length - 1

                                        const usernameString = [username.subdomain, username.domain].join('.')
                                        const isUsernameInUse = usernameString === user.handle

                                        return (
                                            <div className={`bg-black/5 px-3 py-2 ${isLastUsername ? '' : 'mb-2'}`} key={username.id}>
                                                <p className="text-lg">{usernameString}</p>
                                                <p className="text-sm">{isUsernameInUse ? <a className="text-green-300">Aktif</a> : <a className={`font-semibold ${isSwitchingToSomeUsername ? 'cursor-not-allowed opacity-25' : 'hover:underline cursor-pointer text-blue-300'} ${isSwitchingToUsername ? 'cursor-wait' : ''}`} onClick={() => isSwitchingToSomeUsername ? {} : switchToUsername(username.id)}>{isSwitchingToUsername ? 'Mengganti...' : 'Tetapkan sebagai utama'}</a>} &bull; <a className={`text-red-500 ${isReleasingSomeUsername ? 'cursor-not-allowed' : 'cursor-pointer hover:underline'}`} onClick={() => isReleasingSomeUsername ? {} : releaseUsername(username.id)}> {isReleasingUsername ? 'Menghapus...' : 'Hapus'}</a> <br /> <span className="opacity-75">terdaftar pada {new Date(username.createdAt).toDateString()} </span>
                                                </p>
                                            </div>
                                        )
                                    })}
                                    <p className="text-xs opacity-75 mt-2"><b>Tip</b>: jika Anda tidak menggunakan handle sebagai handle utama, handle yang telah Anda daftarkan akan tetap menuju ke akun Anda ketika diklik atau dimention! </p>
                                    <p className="text-xs opacity-75 mt-2"><b>Tip</b>: jika Anda kesulitan menetapkan handle sebagai handle utama, Anda tetap dapat menetapkan handle yang terdaftar secara manual di aplikasi atau website Bluesky</p>
                                </>
                            ) : (
                          	<p>Anda belum mendaftarkan handle</p>
						)}
						</>
					) : (
						<p>Menampilkan handle...</p>
					)}
				</div>
				<div className="bg-black/5 px-5 py-3">
				
					{(usernames?.length || 0) < MAX_USERNAMES ? (
						<div className="w-full">
							<div className="w-full flex flex-row">
								<Input className="flex-grow" type="text" placeholder="Subdomain" value={subdomain} onChange={e => setSubdomain(e.target.value?.trim() || '')} />
								<div className="w-2" />
								<Select className="flex-grow" value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}>
									<option value="">Pilih domain</option>
									{domainsList.map(domain => (
										<option value={domain} key={domain}>.{domain}</option>
									))}
								</Select>
							</div>
							{(available && !isCheckingAvailability && isUsernameValid) && (
								<div className="mb-2">
									{usernameOwner.verified ? (
										<div className="text-white bg-green-500 px-3 py-2 mb-2">
											<p>{username} Tersedia!</p>
										</div>
									) : (
										<div className="text-white bg-yellow-500 px-3 py-2 mb-2">
											<p>{selectedDomain} dimiliki oleh <a className="underline" href={usernameOwner.usernameUrl}>@{usernameOwner.username}</a>{usernameOwner.attestationUrl ? <>, mereka telah mengirimkan pengesahan untuk menjaga nama pengguna ini tetap hidup  <a className="underline" href={usernameOwner.attestationUrl} target="_blank">Disini</a></> : ''}</p>
										</div>
									)}
									<p className="mt-5 text-sm font-semibold">Perjanjian Pendaftaran</p>
									<div className="text-sm opacity-75 mb-2">
										<p>Setelah mengklik tombol di bawah, handle Bluesky Anda akan diperbarui secara otomatis menjadi <b>{username}</b> .</p> 
										<ul>
											<li>
												&bull; Jika Anda menggunakan handle default yang terikat dengan server Anda, seperti <i>@contoh.bsky.social</i> , handle ini akan secara otomatis dilepas dari akun Anda dan dirilis ke publik dan dapat digunakan oleh siapa saja. 
											</li>
											<li>
												&bull;  Jika Anda menggunakan nama pengguna khusus, seperti <i>@contoh.com</i>, handle ini tidak akan dirilis ke publik dan tidak bisa digunakan orang lain. 
											</li>
										</ul>
										<p>Kami akan melakukan segala upaya untuk terus menghosting handle Anda di infrastruktur kami secara gratis selama kami bisa. Namun, tidak ada jaminan bahwa nama pengguna akan bertahan selamanya. Jika handle atau layanan Anda hilang, Anda selalu dapat mengubah nama pengguna Anda kembali di aplikasi Bluesky. </p>
									</div>
									<div className="flex items-start mb-1">
										<input className="mt-[5px]" type="checkbox" checked={confirmed} onChange={e => setConfirmed(_confirmed => !_confirmed)}></input>
										<p className="ml-2 cursor-default" onClick={() => setConfirmed(_confirmed => !_confirmed)}>Saya menyadari dengan mendaftarkan <b>{username}</b> di <span className="text-blue-400">BIRU</span> dan mengklik tombol di bawah, saya mungkin kehilangan handle yang saya gunakan saat ini secara permanen, dan saya tidak dijamin akan menyimpan handle {username} selamanya. </p>
									</div>
									<div className="flex items-start mb-2">
										<input className="mt-[5px]" type="checkbox" checked={setAsPrimaryUsername} onChange={e => setSetAsPrimaryUsername(_primary => !_primary)}></input>
										<div className="ml-2  cursor-default" onClick={() => setSetAsPrimaryUsername(_primary => !_primary)}>
											<p>Gunakan sebagai handle utama</p>
											<p className="text-xs">Otomatis gunakan <b>{username}</b> sebagai handle utama anda di Bluesky. Ini akan terlihat di profil Anda. Handle yang terdaftar disini akan selalu menuju ke akun Anda saat diklik atau dimention, meskipun tidak ditetapkan sebagai handle utama</p>
										</div>
									</div>
								</div>
							)}
							<Button className="w-full" onClick={registerUsername} disabled={!available || !isUsernameValid ||!confirmed || isRegistering || isCheckingAvailability}>
								{(isCheckingAvailability ? (
									`Cek ketersediaan untuk ${username}...`
								) : (
									(isRegistering ? (
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
									))
								))}
							</Button>
						</div>
					) : (
						<p>Anda telah mencapai maksimal jumlah handle yang bisa diklaim</p>
					)}
				</div>
				
			</div>
		</div>
	)
}
