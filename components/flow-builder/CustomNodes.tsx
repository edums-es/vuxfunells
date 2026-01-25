import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { 
  MessageSquare, 
  Video, 
  Clock, 
  MousePointerClick, 
  Settings, 
  Phone, 
  ShoppingCart, 
  Star, 
  Tag, 
  Play, 
  Image as ImageIcon, 
  Music, 
  Mic,
  GitBranch,
  Type,
  Webhook,
  ArrowRightCircle,
  StopCircle,
  FileAudio,
  FileVideo,
  Trash2, // Added trash icon
  Mail,
  MessageCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Mapeamento de ícones e cores por tipo
const NODE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  // Core/Legacy
  start: { icon: Play, color: '#10b981', label: 'Início' },
  doctor: { icon: Settings, color: '#6366f1', label: 'Config: Doutora' },
  'config-audio': { icon: Music, color: '#ec4899', label: 'Config: Áudio' }, // Legacy name
  
  // Content
  message: { icon: MessageSquare, color: '#3b82f6', label: 'Texto' },
  'chat-message': { icon: MessageSquare, color: '#3b82f6', label: 'Texto' }, // Legacy alias
  image: { icon: ImageIcon, color: '#f43f5e', label: 'Imagem' },
  audio: { icon: FileAudio, color: '#d946ef', label: 'Áudio' },
  video: { icon: FileVideo, color: '#8b5cf6', label: 'Vídeo' },
  
  // Interactions
  'incoming-call': { icon: Phone, color: '#f59e0b', label: 'Chamada' },
  'video-call': { icon: Video, color: '#ef4444', label: 'Vídeo VSL' },
  'user_input': { icon: Type, color: '#06b6d4', label: 'Entrada de Dados' },
  
  // Logic
  delay: { icon: Clock, color: '#64748b', label: 'Aguardar' },
  condition: { icon: GitBranch, color: '#eab308', label: 'Condição' },
  api_action: { icon: Webhook, color: '#84cc16', label: 'Integração API' },
  redirect: { icon: ArrowRightCircle, color: '#a855f7', label: 'Redirecionar' },
  end: { icon: StopCircle, color: '#1f2937', label: 'Fim' },
  
  // Sales
  checkout: { icon: ShoppingCart, color: '#14b8a6', label: 'Checkout' },
  upsell: { icon: Tag, color: '#f97316', label: 'Upsell' },
  reviews: { icon: Star, color: '#fbbf24', label: 'Prova Social' },
  
  // Marketing
  email: { icon: Mail, color: '#ec4899', label: 'E-mail Marketing' },
  whatsapp: { icon: MessageCircle, color: '#22c55e', label: 'WhatsApp' },
};

const CustomNodeBase = ({ id, data, type, selected }: NodeProps & { type: string }) => {
  // Normalize type aliases
  const normalizedType = type === 'config-audio' ? 'config-audio' : type;
  const config = NODE_CONFIG[normalizedType] || { icon: MessageSquare, color: '#64748b', label: 'Node' };
  const Icon = config.icon;
  
  // Dados específicos podem vir no data
  const customLabel = String((data as any)?.label || config.label);

  const { deleteElements } = useReactFlow();

  const handleDelete = useCallback((e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent node selection
      deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  return (
    <div className={cn(
      "w-[280px] rounded-xl overflow-hidden shadow-lg transition-all duration-200 bg-neutral-900 border-2 group relative",
      selected ? "border-white ring-2 ring-white/20 scale-105" : "border-transparent hover:border-white/20"
    )}>
      {/* Delete Button (visible on hover or selected) */}
      <button 
        onClick={handleDelete}
        className="absolute top-1 right-1 z-50 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 hover:scale-100"
        title="Excluir Nó"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* Header Colorido */}
      <div 
        className="px-4 py-2 flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider"
        style={{ backgroundColor: config.color }}
      >
        <Icon className="w-4 h-4" />
        <span className="truncate">{customLabel}</span>
      </div>

      {/* Corpo do Card */}
      <div className="p-4 bg-neutral-900 text-neutral-200 text-sm">
          {(type === 'image' || type === 'video' || type === 'audio') && ((data as any)?.url || (data as any)?.mediaUrl) && (
          <div className="mb-2 rounded overflow-hidden relative aspect-video bg-black/50 flex items-center justify-center">
            {type === 'image' ? (
                 <img src={String((data as any)?.url || (data as any)?.mediaUrl)} alt="Preview" className="w-full h-full object-cover" />
            ) : type === 'video' ? (
                <Video className="w-8 h-8 text-neutral-500" />
            ) : (
                <FileAudio className="w-8 h-8 text-neutral-500" />
            )}
          </div>
        )}
        
        <div className="line-clamp-3 text-xs leading-relaxed opacity-80">
          {(data as any)?.previewText || (data as any)?.content || '...'}
        </div>

        {/* Badges/Tags extras */}
        {data.tags && (
          <div className="mt-3 flex flex-wrap gap-1">
            {(data.tags as string[]).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-neutral-400 border border-white/5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Handles para conexões - AUMENTADO PARA FACILITAR CONEXÃO */}
      {/* Start node only has source */}
      {type !== 'start' && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!bg-white !w-4 !h-4 !border-4 !border-neutral-900 hover:!bg-purple-400 hover:!w-5 hover:!h-5 transition-all" 
        />
      )}
      {/* End node only has target */}
      {type !== 'end' && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="!bg-white !w-4 !h-4 !border-4 !border-neutral-900 hover:!bg-purple-400 hover:!w-5 hover:!h-5 transition-all" 
        />
      )}
    </div>
  );
};

// Exportar componentes memoizados para cada tipo
export const StartNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="start" />);
export const DoctorNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="doctor" />);
export const AudioNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="audio" />); // Generic audio
export const ConfigAudioNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="config-audio" />); // Legacy
export const IncomingCallNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="incoming-call" />);
export const ChatMessageNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="chat-message" />);
export const MessageNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="message" />);
export const ImageNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="image" />);
export const VideoNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="video" />);
export const VideoCallNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="video-call" />);
export const ReviewsNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="reviews" />);
export const CheckoutNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="checkout" />);
export const UpsellNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="upsell" />);
export const DelayNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="delay" />);
export const ConditionNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="condition" />);
export const UserInputNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="user_input" />);
export const ApiActionNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="api_action" />);
export const RedirectNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="redirect" />);
export const EndNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="end" />);
export const EmailNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="email" />);
export const WhatsappNode = memo((props: NodeProps) => <CustomNodeBase {...props} type="whatsapp" />);

export const nodeTypes = {
  start: StartNode,
  doctor: DoctorNode,
  audio: AudioNode,
  'config-audio': ConfigAudioNode, // Keep legacy
  'incoming-call': IncomingCallNode,
  'chat-message': ChatMessageNode,
  message: MessageNode,
  image: ImageNode,
  video: VideoNode,
  'video-call': VideoCallNode,
  reviews: ReviewsNode,
  checkout: CheckoutNode,
  upsell: UpsellNode,
  delay: DelayNode,
  condition: ConditionNode,
  user_input: UserInputNode,
  api_action: ApiActionNode,
  redirect: RedirectNode,
  end: EndNode,
  email: EmailNode,
  whatsapp: WhatsappNode
};
