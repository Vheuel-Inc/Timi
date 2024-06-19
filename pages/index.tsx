import { useCallback, useState } from 'react';
import axios from 'axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { useUser } from '../utils/hooks';
import { BskyAgent, RichText } from '@atproto/api';

export default function Index() {
    const { user, fetchUser, credentials, logout } = useUser();

    const [postContent, setPostContent] = useState('');
    const [postDate, setPostDate] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const createPost = useCallback(async () => {
        setError(null);
        setSuccess(null);
        try {
            const agent = new BskyAgent({ service: 'https://bsky.social' });

            await agent.login({
                identifier: credentials.username,
                password: credentials.password,
            });

            const rt = new RichText({ text: postContent });
            await rt.detectFacets(agent);

            const createdAt = new Date(postDate);

            const post = {
                $type: 'app.bsky.feed.post',
                text: rt.text,
                facets: rt.facets,
                createdAt: createdAt.toISOString(),
            };

            const response = await agent.api.app.bsky.feed.post.create(
                { repo: agent.session!.did },
                post
            );

            setSuccess('Post created successfully with URI: ' + response.uri);
        } catch (error) {
            console.error('Error creating post:', error);
            setError('Failed to create post. Please check the inputs and try again.');
        }
    }, [postContent, postDate, credentials]);

    if (!user) return <></>;

    return (
        <div className="w-screen h-screen flex flex-col items-center px-3 py-2 my-5">
            <div className="flex flex-col mx-5 md:w-1/2 xl:w-1/3 overflow-scroll">
                <div className="mx-3 my-2 flex flex-row mb-5">
                    <div>
                        <p className="text-3xl text-blue-100 font-bold">BIRU</p>
                        <p>Handle unik dan gratis untuk Bluesky</p>
                    </div>
                    <div className="flex-grow" />
                    <img
                        src={user.avatar}
                        className="h-10 rounded-full cursor-pointer"
                        onClick={() => {
                            if (!confirm('Keluarkan Akun?')) return;
                            logout();
                        }}
                    />
                </div>
                <Input
                    label="Post Content"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                />
                <Input
                    label="Post Date (YYYY-MM-DDTHH:MM:SSZ)"
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                />
                <Button onClick={createPost} disabled={!postContent || !postDate}>
                    Create Post
                </Button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {success && <p className="text-green-500 mt-2">{success}</p>}
            </div>
        </div>
    );
}
