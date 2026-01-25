import React from 'react';
import { 
  MessageSquare, 
  Video, 
  Clock, 
  Settings, 
  Phone, 
  ShoppingCart, 
  Star, 
  Tag, 
  Image as ImageIcon, 
  Music, 
  Mic, 
  Type, 
  GitBranch, 
  Webhook, 
  ArrowRightCircle, 
  StopCircle,
  FileAudio,
  FileVideo,
  Mail,
  MessageCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const FlowToolbar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, payload?: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (payload) {
        event.dataTransfer.setData('application/payload', JSON.stringify(payload));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-neutral-900 border-r border-white/5 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Toolkit</h2>
        <p className="text-xs text-neutral-500 mt-1">Arraste os elementos para o fluxo</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Configurações */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 px-1">Configurações</h3>
          <div className="grid grid-cols-2 gap-2">
            <DraggableItem 
                icon={Settings} 
                label="Doutor(a)" 
                color="bg-pink-500" 
                onDragStart={(e) => onDragStart(e, 'doctor')} 
            />
            <DraggableItem 
                icon={Music} 
                label="Config: Áudio" 
                color="bg-pink-500" 
                onDragStart={(e) => onDragStart(e, 'config-audio')} 
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 px-1">Conteúdo</h3>
          <div className="grid grid-cols-2 gap-2">
            <DraggableItem 
                icon={MessageSquare} 
                label="Texto" 
                color="bg-blue-500" 
                onDragStart={(e) => onDragStart(e, 'chat-message')} 
            />
            <DraggableItem 
                icon={ImageIcon} 
                label="Imagem" 
                color="bg-rose-500" 
                onDragStart={(e) => onDragStart(e, 'image')} 
            />
            <DraggableItem 
                icon={FileAudio} 
                label="Áudio" 
                color="bg-fuchsia-500" 
                onDragStart={(e) => onDragStart(e, 'audio')} 
            />
            <DraggableItem 
                icon={FileVideo} 
                label="Vídeo" 
                color="bg-violet-500" 
                onDragStart={(e) => onDragStart(e, 'video')} 
            />
          </div>
        </div>

        {/* Interações */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 px-1">Interações</h3>
          <div className="grid grid-cols-2 gap-2">
            <DraggableItem 
                icon={Phone} 
                label="Chamada Voz" 
                color="bg-amber-500" 
                onDragStart={(e) => onDragStart(e, 'incoming-call')} 
            />
            <DraggableItem 
                icon={Video} 
                label="Chamada Vídeo" 
                color="bg-red-500" 
                onDragStart={(e) => onDragStart(e, 'video-call')} 
            />
            <DraggableItem 
                icon={Type} 
                label="Entrada" 
                color="bg-cyan-500" 
                onDragStart={(e) => onDragStart(e, 'user_input')} 
            />
          </div>
        </div>

        {/* Lógica */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 px-1">Lógica</h3>
          <div className="grid grid-cols-2 gap-2">
             <DraggableItem 
                icon={Clock} 
                label="Aguardar" 
                color="bg-slate-500" 
                onDragStart={(e) => onDragStart(e, 'delay')} 
            />
            <DraggableItem 
                icon={GitBranch} 
                label="Condição" 
                color="bg-yellow-600" 
                onDragStart={(e) => onDragStart(e, 'condition')} 
            />
            <DraggableItem 
                icon={Webhook} 
                label="API" 
                color="bg-lime-500" 
                onDragStart={(e) => onDragStart(e, 'api_action')} 
            />
            <DraggableItem 
                icon={ArrowRightCircle} 
                label="Redirecionar" 
                color="bg-purple-600" 
                onDragStart={(e) => onDragStart(e, 'redirect')} 
            />
            <DraggableItem 
                icon={StopCircle} 
                label="Fim" 
                color="bg-gray-800" 
                onDragStart={(e) => onDragStart(e, 'end')} 
            />
          </div>
        </div>

        {/* Marketing */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 px-1">Marketing</h3>
          <div className="grid grid-cols-2 gap-2">
             <DraggableItem 
                icon={Mail} 
                label="E-mail" 
                color="bg-pink-500" 
                onDragStart={(e) => onDragStart(e, 'email')} 
            />
             <DraggableItem 
                icon={MessageCircle} 
                label="WhatsApp" 
                color="bg-green-500" 
                onDragStart={(e) => onDragStart(e, 'whatsapp')} 
            />
          </div>
        </div>

        {/* Vendas */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 px-1">Vendas</h3>
          <div className="grid grid-cols-1 gap-2">
             <DraggableItem 
                icon={ShoppingCart} 
                label="Checkout" 
                color="bg-teal-500" 
                onDragStart={(e) => onDragStart(e, 'checkout')} 
            />
             <DraggableItem 
                icon={Star} 
                label="Prova Social" 
                color="bg-yellow-500" 
                onDragStart={(e) => onDragStart(e, 'reviews')} 
            />
             <DraggableItem 
                icon={Tag} 
                label="Upsell" 
                color="bg-orange-500" 
                onDragStart={(e) => onDragStart(e, 'upsell')} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DraggableItem: React.FC<{ 
  icon: any; 
  label: string; 
  color: string;
  onDragStart: (e: React.DragEvent) => void;
}> = ({ icon: Icon, label, color, onDragStart }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center p-3 bg-neutral-800 hover:bg-neutral-700 border border-white/5 hover:border-white/20 rounded-xl cursor-grab active:cursor-grabbing transition-all group"
      draggable
      onDragStart={onDragStart}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-2 text-white shadow-lg", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white text-center leading-tight">{label}</span>
    </div>
  );
};
