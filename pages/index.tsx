import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { BskyAgent, RichText } from '@atproto/api';
import Input from '../components/Input';
import Button from '../components/Button';
import { useDomains, useUser } from '../utils/hooks';
import Select from '../components/Select';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const agent = new BskyAgent({ service: 'https://bsky.social' });
      await agent.login({ identifier: process.env.BSKY_USERNAME!, password: process.env.BSKY_PASSWORD! });

      const rt = new RichText({ text: content });
      await rt.detectFacets(agent);

      const createdAt = new Date(date);

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

      console.log('Post created with URI:', response.uri);
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post.');
    } finally {
      setLoading(false);
    }
  }, [content, date]);

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="content">Post Content:</label>
        <Input
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="date">Date (YYYY-MM-DD):</label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Posting...' : 'Create Post'}
      </Button>
    </form>
  );
};

export default CreatePost;
