export enum ScreenStep {
  INCOMING_CALL = 'INCOMING_CALL',
  LOCK_SCREEN = 'LOCK_SCREEN',
  CHAT_PART_1 = 'CHAT_PART_1',
  VIDEO_CALL = 'VIDEO_CALL',
  CHAT_PART_2 = 'CHAT_PART_2',
  TIKTOK_LOADING = 'TIKTOK_LOADING',
  REVIEWS = 'REVIEWS',
  CHECKOUT = 'CHECKOUT',
  UPSELL = 'UPSELL',
  DOWNSELL = 'DOWNSELL',
  THANK_YOU = 'THANK_YOU'
}

export interface ChatMessage {
  id: string;
  sender: 'doctor' | 'user';
  delay: number; // Delay before showing this message
  type: 'text' | 'audio' | 'image' | 'video';
  content: string; // Text content or Audio duration (e.g., "0:45")
  mediaUrl?: string; // URL for audio/image/video file
  requiresInput?: boolean; // If true, pauses script until user types and sends
  action?: 'open_video' | 'open_reviews' | 'skip_video'; // Special triggers
}

export interface ReviewData {
  id: number;
  name: string;
  age: number;
  location: string;
  text: string;
  videoUrl?: string; // Placeholder for video background
  likes: string;
  comments?: CommentData[];
}

export interface CommentData {
  user: string;
  text: string;
  time: string;
  likes: number;
  avatarId: number;
  avatarUrl?: string; // Optional custom avatar URL
}

export interface FunnelDoctorProfile {
  name: string;
  role: string;
  avatarUrl: string;
  wallpaperUrl: string;
}

export interface CheckoutReviewCard {
  name: string;
  text: string;
  avatarUrl: string;
}

export interface CheckoutBlock {
  id: string;
  type: 'header' | 'hero' | 'bullets' | 'guarantee' | 'reviews' | 'footer' | 'html' | 'video' | 'image' | 'faq';
  content: any; // Flexible content based on type
  styles?: any; // For custom styling
}

export interface CheckoutConfig {
  // Legacy/Default fields (kept for backward compatibility and initialization)
  headerLabel: string;
  headline: string;
  subheadline: string;
  badge: string;
  productName: string;
  productImageUrl?: string;
  price: string;
  compareAtPrice: string;
  valueCents: number;
  primaryCtaText: string;
  secondaryCtaText: string;
  securePaymentText: string;
  bullets: string[];
  guaranteeTitle: string;
  guaranteeText: string;
  checkoutReviews: CheckoutReviewCard[];
  footerLines: string[];
  
  // New Pagebuilder Blocks
  blocks?: CheckoutBlock[];
}

export interface OfferConfig {
  id: string;
  title: string;
  subtitle: string;
  mediaUrl?: string;
  price: string;
  compareAtPrice?: string;
  valueCents: number;
  bullets: string[];
  acceptText: string;
  declineText: string;
  externalId?: string; // ID na plataforma externa (Hotmart/Kiwify)
}

export interface VideoCallConfig {
  videoUrl?: string;
  audioUrl?: string; // For voice call simulation
  duration?: number; // seconds
}

export interface IntegrationsConfig {
  gateway?: {
    provider: 'stripe' | 'mercadopago' | 'custom';
    publicKey?: string;
    secretKey?: string;
    pixelId?: string;
  };
  externalPlatform?: {
    enabled: boolean;
    provider: 'hotmart' | 'kiwify' | 'perfectpay';
    productId?: string;
    token?: string;
    webhookUrl?: string; // URL para receber notificações da plataforma
  };
}

export interface MarketingConfig {
  emailMarketing?: {
    provider: 'activecampaign' | 'mailchimp' | 'n8n' | 'custom';
    apiKey?: string;
    listId?: string;
    webhookUrl?: string;
  };
  abandonedCart?: {
    enabled: boolean;
    delayMinutes: number;
    subject: string;
    body: string; // HTML or Text
  };
  orderRecovery?: {
    enabled: boolean;
    subject: string;
    body: string;
  };
}

export interface FunnelDefinition {
  doctor: FunnelDoctorProfile;
  chat: {
    part1: ChatMessage[];
    part2: ChatMessage[];
  };
  videoCall?: VideoCallConfig;
  incomingCall?: {
    duration: number; // seconds before auto-answer/timeout
    ringtoneUrl?: string; // Custom ringtone
    voiceUrl?: string; // Audio to play when answered
    autoStartVideo?: boolean;
  };
  reviews: {
    items: ReviewData[];
  };
  checkout: CheckoutConfig;
  offers: {
    upsells: OfferConfig[];
    downsells: OfferConfig[];
  };
  integrations?: IntegrationsConfig;
  marketing?: MarketingConfig;
  theme?: 'dark' | 'light';
}

export interface PublicFunnelResponse {
  id: string;
  version: number;
  name: string;
  definition: FunnelDefinition;
}
