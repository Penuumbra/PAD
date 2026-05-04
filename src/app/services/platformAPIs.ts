import {
  InstagramCreds, YouTubeCreds, TwitterCreds,
  LinkedInCreds, FacebookCreds, TikTokCreds,
} from './apiConfig';

export type ConnectionStatus = 'connected' | 'error' | 'unconfigured';

export interface PlatformMetrics {
  platform: string;
  status: ConnectionStatus;
  errorMessage?: string;
  lastUpdated: string;
  followers?: number;
  following?: number;
  totalPosts?: number;
  avgReach?: number;
  avgImpressions?: number;
  avgEngagement?: number;
  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
  avgSaves?: number;
  avgViews?: number;
  engagementRate?: number;
  subscribers?: number;
  totalViews?: number;
  monthlyListeners?: number;
  channelId?: string;
}

function errorMetric(platform: string, message: string): PlatformMetrics {
  return {
    platform,
    status: 'error',
    errorMessage: message,
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchInstagramMetrics(creds: InstagramCreds): Promise<PlatformMetrics> {
  const base = 'https://graph.facebook.com/v24.0';
  try {
    const profileRes = await fetch(
      `${base}/${creds.userId}?fields=id,username,name,followers_count,follows_count,media_count`,
      {
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
        },
      }
    );
    if (!profileRes.ok) {
      const err = await profileRes.json();
      throw new Error(err.error?.message ?? `HTTP ${profileRes.status}`);
    }
    const profile = await profileRes.json();

    const mediaRes = await fetch(
      `${base}/${creds.userId}/media?fields=id,media_type,timestamp,like_count,comments_count&limit=12`,
      {
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
        },
      }
    );
    if (!mediaRes.ok) {
      const err = await mediaRes.json();
      throw new Error(err.error?.message ?? `HTTP ${mediaRes.status}`);
    }
    const mediaData = await mediaRes.json();
    const posts: Array<{ like_count?: number; comments_count?: number }> = mediaData.data ?? [];

    const totalLikes = posts.reduce((a, p) => a + (p.like_count ?? 0), 0);
    const totalComments = posts.reduce((a, p) => a + (p.comments_count ?? 0), 0);
    const count = posts.length || 1;
    const avgLikes = Math.round(totalLikes / count);
    const avgComments = Math.round(totalComments / count);
    const avgEngagement = avgLikes + avgComments;
    const followers = profile.followers_count ?? 0;

    return {
      platform: 'instagram',
      status: 'connected',
      lastUpdated: new Date().toISOString(),
      followers,
      following: profile.follows_count ?? 0,
      totalPosts: profile.media_count ?? posts.length,
      avgLikes,
      avgComments,
      avgEngagement,
      engagementRate: followers > 0 ? parseFloat(((avgEngagement / followers) * 100).toFixed(2)) : 0,
    };
  } catch (e: unknown) {
    return errorMetric('instagram', e instanceof Error ? e.message : 'Erro desconhecido');
  }
}

export async function fetchYouTubeMetrics(creds: YouTubeCreds): Promise<PlatformMetrics> {
  const base = 'https://www.googleapis.com/youtube/v3';
  try {
    const authHeaders = creds.accessToken ? { Authorization: `Bearer ${creds.accessToken}` } : undefined;
    const channelQuery = creds.accessToken
      ? `${base}/channels?part=snippet,statistics,contentDetails&mine=true`
      : `${base}/channels?part=snippet,statistics,contentDetails&id=${creds.channelId}&key=${creds.apiKey}`;
    const chanRes = await fetch(
      channelQuery,
      authHeaders ? { headers: authHeaders } : undefined
    );
    if (!chanRes.ok) throw new Error(`HTTP ${chanRes.status}`);
    const chanData = await chanRes.json();
    const channel = chanData.items?.[0];
    const stats = channel?.statistics;
    if (!stats) throw new Error('Canal nao encontrado. Verifique o Channel ID.');
    const channelId = channel.id ?? creds.channelId;
    const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads;

    let videoIds: string[] = [];
    if (uploadsPlaylist) {
      const playlistUrl = creds.accessToken
        ? `${base}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylist}&maxResults=10`
        : `${base}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylist}&maxResults=10&key=${creds.apiKey}`;
      const playlistRes = await fetch(playlistUrl, authHeaders ? { headers: authHeaders } : undefined);
      if (playlistRes.ok) {
        const playlistData = await playlistRes.json();
        videoIds = (playlistData.items ?? [])
          .map((v: { contentDetails?: { videoId?: string } }) => v.contentDetails?.videoId)
          .filter(Boolean);
      }
    }

    let avgViews = 0;
    let avgLikes = 0;
    let avgComments = 0;
    if (videoIds.length > 0) {
      const videosUrl = creds.accessToken
        ? `${base}/videos?part=statistics&id=${videoIds.join(',')}`
        : `${base}/videos?part=statistics&id=${videoIds.join(',')}&key=${creds.apiKey}`;
      const vidRes = await fetch(
        videosUrl,
        authHeaders ? { headers: authHeaders } : undefined
      );
      if (!vidRes.ok) throw new Error(`HTTP ${vidRes.status}`);
      const vidData = await vidRes.json();
      const videos: Array<{ statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }> =
        vidData.items ?? [];
      const n = videos.length || 1;
      avgViews = Math.round(videos.reduce((a, v) => a + parseInt(v.statistics?.viewCount ?? '0'), 0) / n);
      avgLikes = Math.round(videos.reduce((a, v) => a + parseInt(v.statistics?.likeCount ?? '0'), 0) / n);
      avgComments = Math.round(videos.reduce((a, v) => a + parseInt(v.statistics?.commentCount ?? '0'), 0) / n);
    }

    return {
      platform: 'youtube',
      status: 'connected',
      lastUpdated: new Date().toISOString(),
      channelId,
      followers: parseInt(stats.subscriberCount ?? '0'),
      subscribers: parseInt(stats.subscriberCount ?? '0'),
      totalViews: parseInt(stats.viewCount ?? '0'),
      totalPosts: parseInt(stats.videoCount ?? '0'),
      avgViews,
      avgLikes,
      avgComments,
      avgEngagement: avgLikes + avgComments,
      engagementRate: avgViews > 0 ? parseFloat(((avgLikes / avgViews) * 100).toFixed(2)) : 0,
    };
  } catch (e: unknown) {
    return errorMetric('youtube', e instanceof Error ? e.message : 'Erro desconhecido');
  }
}

export async function fetchFacebookMetrics(creds: FacebookCreds): Promise<PlatformMetrics> {
  const base = 'https://graph.facebook.com/v24.0';
  try {
    const pageRes = await fetch(
      `${base}/${creds.pageId}?fields=fan_count,posts.limit(10){likes.summary(true),comments.summary(true),shares}`,
      {
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
        },
      }
    );
    if (!pageRes.ok) {
      const err = await pageRes.json();
      throw new Error(err.error?.message ?? `HTTP ${pageRes.status}`);
    }
    const page = await pageRes.json();
    const posts = page.posts?.data ?? [];
    const n = posts.length || 1;

    const avgLikes = Math.round(posts.reduce((a: number, p: { likes?: { summary?: { total_count?: number } } }) =>
      a + (p.likes?.summary?.total_count ?? 0), 0) / n);
    const avgComments = Math.round(posts.reduce((a: number, p: { comments?: { summary?: { total_count?: number } } }) =>
      a + (p.comments?.summary?.total_count ?? 0), 0) / n);
    const avgShares = Math.round(posts.reduce((a: number, p: { shares?: { count?: number } }) =>
      a + (p.shares?.count ?? 0), 0) / n);
    const avgEngagement = avgLikes + avgComments + avgShares;
    const followers = page.fan_count ?? 0;

    return {
      platform: 'facebook',
      status: 'connected',
      lastUpdated: new Date().toISOString(),
      followers,
      totalPosts: posts.length,
      avgLikes,
      avgComments,
      avgShares,
      avgEngagement,
      engagementRate: followers > 0 ? parseFloat(((avgEngagement / followers) * 100).toFixed(2)) : 0,
    };
  } catch (e: unknown) {
    return errorMetric('facebook', e instanceof Error ? e.message : 'Erro desconhecido');
  }
}

export async function fetchTwitterMetrics(_creds: TwitterCreds): Promise<PlatformMetrics> {
  return errorMetric('twitter', 'Twitter/X exige chamada por conector/backend OAuth. Nenhum dado simulado foi usado.');
}

export async function fetchLinkedInMetrics(_creds: LinkedInCreds): Promise<PlatformMetrics> {
  return errorMetric('linkedin', 'LinkedIn exige chamada por conector/backend OAuth. Nenhum dado simulado foi usado.');
}

export async function fetchTikTokMetrics(_creds: TikTokCreds): Promise<PlatformMetrics> {
  return errorMetric('tiktok', 'TikTok exige chamada por conector/backend OAuth. Nenhum dado simulado foi usado.');
}
