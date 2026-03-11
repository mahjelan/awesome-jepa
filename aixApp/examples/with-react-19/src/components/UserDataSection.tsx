import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { db } from '../firebase';
import {
  listUserData,
  listPublicPosts,
  addPost,
  deleteUserDataItem,
  updateUserDataItem,
} from '../services/userData';
import type { FirestoreUser } from '../types/user';
import type { UserDataItem, SavedAnswerMetadata, PostVisibility } from '../types/userData';
import { loadPreferences } from '../services/settingsPreferences';

interface UserDataSectionProps {
  user: FirestoreUser;
}

function isVideoUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mov|avi|mkv|m4v)(\?|$)/i.test(path) || path.includes('/video');
  } catch {
    return false;
  }
}

function formatTime(createdAt: { toDate?: () => Date } | null): string {
  if (!createdAt?.toDate) return '';
  const d = createdAt.toDate();
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d`;
  return d.toLocaleDateString();
}

/** Link to open or download media (opens in new tab; may display or download depending on file/headers). */
function OpenMediaLink({ url, label = 'Download' }: { url: string; label?: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="feed-open-media">
      {label}
    </a>
  );
}

/** Renders video with fallback when playback fails. */
function FeedVideoPlayer({ mediaUrl }: { mediaUrl: string }) {
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (playbackFailed) {
    return (
      <div className="feed-media-fallback-box">
        <p className="feed-media-fallback">
          Video couldn&apos;t be played in this browser. <OpenMediaLink url={mediaUrl} label="Download video" />
        </p>
      </div>
    );
  }
  return (
    <div className="feed-video-wrap">
      {!loaded && (
        <div className="feed-media-detecting" style={{ marginBottom: 0 }}>Loading video…</div>
      )}
      <video
        key={mediaUrl}
        controls
        playsInline
        preload="metadata"
        className="feed-media-video"
        src={mediaUrl}
        onLoadedData={() => setLoaded(true)}
        onError={() => setPlaybackFailed(true)}
      >
        <source src={mediaUrl} type="video/mp4" />
        <source src={mediaUrl} type="video/webm" />
        Your browser doesn&apos;t support video. <OpenMediaLink url={mediaUrl} label="Download video" />
      </video>
      <p className="feed-video-download-row">
        <OpenMediaLink url={mediaUrl} label="Download video" />
      </p>
    </div>
  );
}

/**
 * Renders image or video. Uses stored mediaType when present; otherwise tries
 * <img> first and switches to <video> on error (in-DOM, same CORS as display).
 */
function FeedMedia({
  mediaUrl,
  mediaType: storedType,
  itemId,
}: {
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  itemId: string;
}) {
  const [displayAs, setDisplayAs] = useState<'image' | 'video' | null>(storedType ?? null);

  if (storedType === 'image') {
    return (
      <div className="feed-media-block">
        <img src={mediaUrl} alt="" className="feed-media-img" loading="lazy" />
        <p className="feed-open-media-row"><OpenMediaLink url={mediaUrl} label="Download image" /></p>
      </div>
    );
  }
  if (storedType === 'video') {
    return (
      <div className="feed-media-block feed-media-block-video">
        <FeedVideoPlayer mediaUrl={mediaUrl} />
      </div>
    );
  }

  if (displayAs === 'video') {
    return (
      <div className="feed-media-block feed-media-block-video">
        <FeedVideoPlayer key={itemId} mediaUrl={mediaUrl} />
      </div>
    );
  }

  return (
    <div className="feed-media-block">
      <img
        src={mediaUrl}
        alt=""
        className="feed-media-img"
        loading="lazy"
        onLoad={() => setDisplayAs('image')}
        onError={() => setDisplayAs('video')}
      />
      <p className="feed-open-media-row"><OpenMediaLink url={mediaUrl} label="Download" /></p>
    </div>
  );
}

type FeedTab = 'public' | 'mine';

export default function UserDataSection({ user }: UserDataSectionProps) {
  const [posts, setPosts] = useState<UserDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(() => loadPreferences().defaultPostVisibility);
  const [feedTab, setFeedTab] = useState<FeedTab>('public');
  const navigate = useNavigate();

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listUserData(db, user.id);
      setPosts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const loadPublicPosts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listPublicPosts(db);
      setPosts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load public feed');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setError('');
    if (feedTab === 'public') loadPublicPosts();
    else loadPosts();
  }, [feedTab, loadPublicPosts, loadPosts]);

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    setError('');
    const text = content.trim();
    if (!text) {
      setError('Write something to post.');
      return;
    }
    setPosting(true);
    try {
      await addPost(db, user.id, { content: text, visibility }, { id: user.id, name: user.name, userid: user.userid });
      setContent('');
      if (feedTab === 'public') await loadPublicPosts();
      else await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(item: UserDataItem) {
    const ownerId = item.ownerId ?? user.id;
    if (ownerId !== user.id) return;
    try {
      await deleteUserDataItem(db, ownerId, item.id);
      setPosts((prev) => prev.filter((p) => p.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleToggleVisibility(item: UserDataItem, newVisibility: PostVisibility) {
    const ownerId = feedTab === 'mine' ? user.id : item.ownerId;
    if (!ownerId || ownerId !== user.id) return;
    try {
      const updates: Parameters<typeof updateUserDataItem>[3] =
        newVisibility === 'public'
          ? {
              visibility: 'public',
              authorId: user.id,
              authorName: user.name ?? '',
              authorUserid: user.userid ?? '',
            }
          : { visibility: 'private' };
      await updateUserDataItem(db, ownerId, item.id, updates);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, visibility: newVisibility, authorId: user.id, authorName: user.name ?? '', authorUserid: user.userid ?? '' }
            : p
        )
      );
      if (feedTab === 'public' && newVisibility === 'private') {
        setPosts((prev) => prev.filter((p) => p.id !== item.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visibility');
    }
  }

  /** Whether item is a saved AI discovery. */
  function isSavedAnswer(item: UserDataItem): item is UserDataItem & { metadata: SavedAnswerMetadata } {
    return item.type === 'saved_answer' && !!item.metadata && 'query' in item.metadata && 'markdown' in item.metadata;
  }

  /** For feed display: get caption, media URL, and type from any item. */
  function getPostContent(item: UserDataItem): {
    caption: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
  } {
    const caption =
      item.type === 'post'
        ? String(item.value)
        : item.name
          ? `${item.name}: ${item.value}`
          : String(item.value);
    const mediaUrl = item.mediaUrl ?? (item.type === 'media' ? String(item.value) : undefined);
    // Prefer stored mediaType; for posts with mediaUrl but no extension (e.g. Storage URL), assume video so we don't render <img> for a video URL
    const mediaType =
      item.mediaType ??
      (mediaUrl && item.type === 'post'
        ? 'video'
        : mediaUrl && isVideoUrl(mediaUrl)
          ? 'video'
          : undefined);
    return { caption: caption.trim() || '—', mediaUrl, mediaType };
  }

  const initial = user.name?.charAt(0)?.toUpperCase() ?? user.userid?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="feed">
      <div className="feed-composer">
        <div className="feed-composer-avatar" aria-hidden>{initial}</div>
        <form onSubmit={handlePost} className="feed-composer-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={2}
            disabled={posting}
            className="feed-composer-input"
          />
          <div className="feed-visibility-row">
            <span className="feed-visibility-label">Post to:</span>
            <label className="feed-visibility-option">
              <input
                type="radio"
                name="visibility"
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
                disabled={posting}
              />
              <span>Public feed</span>
            </label>
            <label className="feed-visibility-option">
              <input
                type="radio"
                name="visibility"
                checked={visibility === 'private'}
                onChange={() => setVisibility('private')}
                disabled={posting}
              />
              <span>Only my page</span>
            </label>
          </div>
          <div className="feed-composer-actions">
            <div className="feed-composer-actions-buttons">
              <button
                type="button"
                className="feed-discover-btn"
                title="Ask a question and save answers to your feed"
                onClick={() => navigate('/search')}
              >
                Discover
              </button>
              <button type="submit" className="feed-composer-submit" disabled={posting}>
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
          {error && <p className="feed-error">{error}</p>}
        </form>
      </div>

      <div className="feed-tabs" role="tablist" aria-label="Feed view">
        <button
          type="button"
          role="tab"
          aria-selected={feedTab === 'public'}
          className={`feed-tab-toggle feed-tab-toggle--${feedTab === 'public' ? 'public' : 'mine'}`}
          onClick={() => {
            const nextTab = feedTab === 'public' ? 'mine' : 'public';
            setFeedTab(nextTab);
            if (nextTab === 'public') loadPublicPosts();
            else loadPosts();
          }}
          aria-label={feedTab === 'public' ? 'Showing public feed. Click to show my posts.' : 'Showing my posts. Click to show public feed.'}
          title={feedTab === 'public' ? 'Switch to my posts' : 'Switch to public feed'}
        >
          {feedTab === 'public' ? 'Public feed' : 'My posts'}
        </button>
      </div>

      {error && feedTab === 'public' && error.includes('index') && (
        <p className="feed-error feed-error--block">
          Public feed needs a Firestore index. Use the link in the error above to create it, or run <code>firebase deploy --only firestore:indexes</code>.
        </p>
      )}

      {loading ? (
        <p className="feed-loading">Loading feed…</p>
      ) : (posts ?? []).length === 0 ? (
        <p className="feed-empty">
          {feedTab === 'public' ? 'No public posts yet. Be the first to post to the public feed.' : 'No posts yet. Share something above.'}
        </p>
      ) : (
        <ul className="feed-list">
          {(posts ?? []).map((item) => {
            const canEdit = feedTab === 'mine' || item.ownerId === user.id;
            const currentVisibility = item.visibility ?? 'private';
            if (isSavedAnswer(item)) {
              const meta = item.metadata;
              const isOwnDiscovery = feedTab === 'mine' || (item.ownerId ?? user.id) === user.id || !item.authorId || item.authorId === user.id;
              const discoveryDisplayName = isOwnDiscovery ? (user.name || user.userid) : (item.authorName || item.authorUserid || 'Someone');
              const discoveryDisplayInitial = discoveryDisplayName.charAt(0).toUpperCase();
              return (
                <li key={item.id} className={`feed-card feed-card-discovery`}>
                  <div className="feed-card-header">
                    <div className="feed-card-avatar" aria-hidden>{discoveryDisplayInitial}</div>
                    <div className="feed-card-meta">
                      <span className="feed-card-name">{discoveryDisplayName}</span>
                      <span className="feed-card-time">{formatTime(item.createdAt)}</span>
                    </div>
                    {canEdit && (
                      <div className="feed-card-header-actions">
                        <button
                          type="button"
                          className="feed-card-delete"
                          onClick={() => handleDelete(item)}
                          title="Delete"
                          aria-label="Delete"
                        >
                          <span className="feed-card-delete-icon" aria-hidden>X</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="feed-card-visibility">
                      <span className="feed-card-visibility-label">Who can see this?</span>
                      <button
                        type="button"
                        className={`feed-card-visibility-toggle feed-card-visibility-toggle--${currentVisibility === 'public' ? 'public' : 'private'}`}
                        onClick={() => handleToggleVisibility(item, currentVisibility === 'public' ? 'private' : 'public')}
                        aria-pressed={currentVisibility === 'public'}
                        aria-label={currentVisibility === 'public' ? 'Visible to everyone. Click to make only visible on your page.' : 'Only visible on your page. Click to make visible to everyone.'}
                        title={currentVisibility === 'public' ? 'Click to make only visible on your page' : 'Click to show on public feed'}
                      >
                        <span className="feed-card-visibility-icon" aria-hidden>
                          {currentVisibility === 'public' ? '🌐' : '🔒'}
                        </span>
                        {currentVisibility === 'public' ? 'Public' : 'Only me'}
                      </button>
                    </div>
                  )}
                  <p className="feed-card-caption">{meta.query}</p>
                  <div className="feed-discovery-markdown">
                    <Markdown>{meta.markdown}</Markdown>
                  </div>
                  {meta.sources && meta.sources.length > 0 && (
                    <div className="feed-discovery-sources">
                      {meta.sources.map((s) => (
                        <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="feed-discovery-source-link">
                          {s.name}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              );
            }
            const { caption, mediaUrl, mediaType } = getPostContent(item);
            const isOwnPost = !item.authorId || item.authorId === user.id;
            const displayName = isOwnPost ? (user.name || user.userid) : (item.authorName || item.authorUserid || 'Someone');
            const displayInitial = displayName.charAt(0).toUpperCase();
            return (
              <li key={item.id} className="feed-card">
                <div className="feed-card-header">
                  <div className="feed-card-avatar" aria-hidden>{displayInitial}</div>
                  <div className="feed-card-meta">
                    <span className="feed-card-name">{displayName}</span>
                    <span className="feed-card-time">{formatTime(item.createdAt)}</span>
                  </div>
                  {canEdit && (
                    <div className="feed-card-header-actions">
                      <button
                        type="button"
                        className="feed-card-delete"
                        onClick={() => handleDelete(item)}
                        title="Delete post"
                        aria-label="Delete post"
                      >
                        <span className="feed-card-delete-icon" aria-hidden>X</span>
                      </button>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="feed-card-visibility">
                    <span className="feed-card-visibility-label">Who can see this?</span>
                    <button
                      type="button"
                      className={`feed-card-visibility-toggle feed-card-visibility-toggle--${currentVisibility === 'public' ? 'public' : 'private'}`}
                      onClick={() => handleToggleVisibility(item, currentVisibility === 'public' ? 'private' : 'public')}
                      aria-pressed={currentVisibility === 'public'}
                      aria-label={currentVisibility === 'public' ? 'Visible to everyone. Click to make only visible on your page.' : 'Only visible on your page. Click to make visible to everyone.'}
                      title={currentVisibility === 'public' ? 'Click to make only visible on your page' : 'Click to show on public feed'}
                    >
                      <span className="feed-card-visibility-icon" aria-hidden>
                        {currentVisibility === 'public' ? '🌐' : '🔒'}
                      </span>
                      {currentVisibility === 'public' ? 'Public' : 'Only me'}
                    </button>
                  </div>
                )}
                {caption && caption !== '—' && (
                  <p className="feed-card-caption">{caption}</p>
                )}
                {mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim().length > 0 && (
                  <div className="feed-card-media">
                    <FeedMedia
                      mediaUrl={mediaUrl.trim()}
                      mediaType={mediaType}
                      itemId={item.id}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
