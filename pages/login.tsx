import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import axios from 'axios'
import { useCookies } from 'react-cookie'

import Input from '../components/Input'
import Button from '../components/Button'

import { useUser } from '../utils/hooks'

const TLD_REGEX = /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i

export default function App() {
	useUser()

	const [, setCookie,] = useCookies(['did', 'server', 'access_token', 'refresh_token'])

	const [server, setServer] = useState('bsky.social')
	const lookupServerTimeoutRef = useRef<NodeJS.Timeout>()
	const [serverDetails, setServerDetails] = useState(null)
	const [isLookingUpServer, setLookingUpServer] = useState(false)

	const [serverError, setServerError] = useState(null)

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const canLogin = useMemo(() => email.length > 0 && password.length > 0, [email, password])
	const [isLoggingIn, setLoggingIn] = useState(false)

	const [session, setSession] = useState(null)
	const [user, setUser] = useState(null)

	const [loginError, setLoginError] = useState(null)

	/**
	 * Server Lookup
	 */
	const lookupServer = useCallback(async () => {
		setServerError(null)

		if(!TLD_REGEX.test(server)) {
			setLookingUpServer(false)

			return
		}

		try {
			const { data } = await axios.get(`https://${server}/xrpc/com.atproto.server.describeServer`)

			setServerDetails(data)
		} catch(error) {
			setServerError(error)
		}

		setLookingUpServer(false)
	}, [server, setServerDetails, setLookingUpServer, setServerError])

	useEffect(() => {
		setServerDetails(null)
		setLookingUpServer(true)

		if(lookupServerTimeoutRef.current) {
			clearTimeout(lookupServerTimeoutRef.current)
			lookupServerTimeoutRef.current = null
		}

		lookupServerTimeoutRef.current = setTimeout(lookupServer, 500)
	}, [server, lookupServer])

	const login = useCallback(async () => {
		setLoginError(null)
		setSession(null)
		setUser(null)

		setLoggingIn(true)

		try {
			const { data: session } = await axios.post(`https://${server}/xrpc/com.atproto.server.createSession`, {
				identifier: email,
				password
			})

			// Set cookies
			const cookieConfig = {
				expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7 * 4 * 12)) // 1 year
			}

			setCookie('did', session.did, cookieConfig)
			setCookie('server', server, cookieConfig)
			setCookie('access_token', session.accessJwt, cookieConfig)
			setCookie('refresh_token', session.refreshJwt, cookieConfig)

			setSession(session)

			const { data: user } = await axios.get(`https://${server}/xrpc/app.bsky.actor.getProfile`, {
				params: {
					actor: session.did
				},
				headers: {
					Authorization: `Bearer ${session.accessJwt}`
				}
			})

			setUser(user)
		} catch(error) {
			setLoginError(error)
		}

		setLoggingIn(false)
	}, [server, email, password, setSession, setUser, setLoggingIn, setLoginError])

	return (
		<div className="w-screen h-screen flex flex-col items-center my-5">
			<div className="flex flex-col mx-5 md:w-1/2 xl:w-1/3 overflow-scroll">
				<div className="flex flex-row mb-1">
					<div>
						<p className="text-3xl font-bold uppercase text-blue-200">Biru</p>
						<p>Handle unik dan gratis untuk Bluesky</p>
					</div>
				</div>
				<div className=" bg-white rounded-lg shadow-md overflow-hidden mb-3 p-4">
					<p className="text-xl font-bold mb-2">Masuk</p>
					<Input
						className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
						placeholder="Server (Contoh: bsky.social)"
						value={server}
						onClick={() => {
							if(!serverDetails)
								return

							setEmail('')
							setPassword('')
							setServerDetails(null)
						}}
						onChange={e => setServer(e.target.value)}
					/>
					{isLookingUpServer && (
						<p className="text-center text-sm opacity-50">Memeriksa server...</p>
					)}
					{serverError && (
						<p className="text-red-500">Server Tidak Ditemukan</p>
					)}
					{serverDetails  && (
						<div className="flex flex-col">
							<Input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
<p className="text-xs opacity-75"><a href="https://bsky.app/settings/app-passwords" className="text-blue-500">Buat kata sandi aplikasi</a> untuk masuk</p>
							<Input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="password" placeholder="Kata sandi aplikasi" value={password} onChange={e => setPassword(e.target.value)} />
							<p className="text-sm mt-3 font-semibold text-red-500">Disclaimer</p>
							<p className="text-sm opacity-75 mb-1">
Kami tidak menyimpan kredensial Bluesky Anda di server kami. Kredensial seperti email & kata sandi aplikasi tersimpan secara lokal diperangkat anda dan hanya dikirimkan ke server untuk verifikasi langsung dengan server Bluesky Anda.</p>
							<p className="text-sm opacity-75 mb-2">Yang kami simpan hanyalah domain value/did (identifier) Anda, handle yang terdaftar (misalnya @contoh.bsky.makeup) dan handle sebelumnya (misalnya @contoh.bsky.social). <br/> Dengan menekan tombol <b>MASUK</b> di bawah ini, Anda menyetujui bahwa Anda tidak keberatan dengan hal ini.</p>
							<Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={login} disabled={!canLogin || isLoggingIn}>{isLoggingIn ? 'Masuk...' : 'Masuk'}</Button>
							{loginError && (
								<p className="text-red-500 mt-2">Terjadi kesalahan saat memverifikasi Akun</p>
							)}
						</div>
					)}
				</div>
				
				<p className="text-sm opacity-75 mt-3">Managed by <a href="https://bsky.app/profile/did:plc:ivvkfsndujdk2vo5zd2gn2e6" className="text-blue-500">Vheüel</a> & <a href="https://t.me/blueskyindo" className="text-blue-500">Friends</a><br/>Donation <a href="https://saweria.co/vheuel" className="text-blue-500">Saweria</a> · <a href="https://cwallet.com/t/LRJVXY13" className="text-blue-500">Crypto</a></p>
			</div>
		</div>
	)
}