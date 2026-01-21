import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle, ShieldCheck, Star, ArrowRight, Lock, Copy, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { CheckoutConfig, CheckoutBlock, IntegrationsConfig } from '../types';
import { openPixCharge, openPixCheckStatus } from '../lib/api';
import { cn } from '../lib/utils';

const BlockRenderer = ({ block, openForm, theme }: { block: CheckoutBlock; openForm: () => void; theme: 'dark' | 'light' }) => {
  if (!block) return null;
  const content = block.content || {};

  switch (block.type) {
    case 'header':
      return (
        <header className={cn(
          "p-4 text-center border-b sticky top-0 z-10",
          theme === 'dark' ? "bg-pink-950/50 border-pink-900" : "bg-pink-50 border-pink-100"
        )}>
          <span className={cn(
            "font-bold tracking-wider text-xs uppercase",
            theme === 'dark' ? "text-pink-400" : "text-pink-600"
          )}>{content.text || ''}</span>
        </header>
      );
    case 'hero':
      return (
        <div className="px-6 py-8 text-center max-w-full">
          <h1 className={cn(
            "text-2xl font-bold leading-tight mb-4",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>{content.headline || ''}</h1>
          <p className={cn(
            "text-sm mb-6",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>{content.subheadline || ''}</p>

          <div className={cn(
            "border-2 rounded-2xl p-6 relative mb-8 shadow-sm",
            theme === 'dark' ? "bg-pink-950/20 border-pink-900" : "bg-pink-50/50 border-pink-500"
          )}>
            {content.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                {content.badge}
              </div>
            )}
            {content.productImageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden shadow-sm">
                <img src={content.productImageUrl} alt="Product" className="w-full h-auto object-cover" />
              </div>
            )}
            <h2 className={cn("text-xl font-bold mb-2", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>{content.productName || ''}</h2>
            <div className="flex justify-center items-end gap-1 mb-4">
              {content.compareAtPrice && <span className="text-gray-400 text-lg line-through">{content.compareAtPrice}</span>}
              <span className="text-4xl font-extrabold text-pink-600">{content.price || ''}</span>
            </div>

            <button
              onClick={openForm}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-2 animate-bounce"
            >
              {content.ctaText || 'Comprar Agora'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> {content.secureText || 'Pagamento seguro'}
            </p>
          </div>
        </div>
      );
    case 'bullets':
      return (
        <div className="px-6 space-y-4 mb-10">
          {content.title && <h3 className={cn("font-bold text-lg mb-2", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>{content.title}</h3>}
          {Array.isArray(content.items) && content.items.map((item: string, idx: number) => {
             if (!item) return null;
             return (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className={cn("text-sm", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>{item}</p>
              </div>
            );
          })}
        </div>
      );
    case 'guarantee':
      return (
        <div className={cn(
          "p-8 text-center mx-4 rounded-2xl mb-6",
          theme === 'dark' ? "bg-neutral-800" : "bg-gray-50"
        )}>
          <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-gray-800")}>{content.title || ''}</h4>
          <p className="text-gray-500 text-sm mt-2">{content.text || ''}</p>
        </div>
      );
    case 'reviews':
      return (
        <div className="px-6 mt-8 mb-8">
          <h3 className={cn("font-bold text-lg mb-4 text-center", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>{content.title || 'Quem já comprou e aprovou:'}</h3>
          <div className="space-y-4">
            {Array.isArray(content.items) && content.items.map((review: any, idx: number) => {
              if (!review) return null;
              return (
                <div key={idx} className={cn(
                  "border shadow-sm rounded-xl p-4",
                  theme === 'dark' ? "bg-neutral-800 border-neutral-700" : "bg-white border-gray-100"
                )}>
                  <div className="flex items-center gap-3 mb-2">
                    <img src={review.avatarUrl || review.avatar || 'https://i.pravatar.cc/100'} alt="User" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{review.name}</p>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className={cn("text-sm leading-snug", theme === 'dark' ? "text-gray-300" : "text-gray-600")}>{review.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    case 'faq':
       return (
         <div className="px-6 mb-8">
           <h3 className="font-bold text-gray-800 text-lg mb-4 text-center">{content.title || 'Perguntas Frequentes'}</h3>
           <div className="space-y-2">
             {Array.isArray(content.items) && content.items.map((item: any, idx: number) => {
               if (!item) return null;
               return (
               <details key={idx} className="group bg-gray-50 rounded-xl overflow-hidden">
                 <summary className="flex items-center justify-between p-4 font-semibold text-sm cursor-pointer list-none">
                   {item.question}
                   <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                 </summary>
                 <div className="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100 pt-2">
                   {item.answer}
                 </div>
               </details>
             );
            })}
           </div>
         </div>
       );
    case 'video':
      return (
        <div className="px-6 mb-8">
          <div className="rounded-xl overflow-hidden shadow-sm bg-black relative aspect-video">
            {content.url ? (
              <video 
                src={content.url} 
                controls={content.controls} 
                autoPlay={content.autoplay} 
                loop 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">Vídeo não configurado</div>
            )}
          </div>
        </div>
      );
    case 'image':
      return (
        <div className="px-6 mb-6">
          {content.url && (
            <img 
              src={content.url} 
              alt={content.alt || 'Image'} 
              className="w-full h-auto rounded-xl shadow-sm" 
            />
          )}
        </div>
      );
    case 'html':
      return <div className="px-6 mb-6" dangerouslySetInnerHTML={{ __html: content.html || '' }} />;
    case 'footer':
      return (
        <footer className="text-center text-gray-300 text-xs py-6">
          {Array.isArray(content.lines) && content.lines.map((line: string, idx: number) => (
            <p key={idx} className={idx === 0 ? '' : 'mt-1'}>{line}</p>
          ))}
        </footer>
      );
    default:
      return null;
  }
};

const Checkout: React.FC<{
  config: CheckoutConfig;
  integrations?: IntegrationsConfig;
  onStartCheckout: (contact: { name?: string; email?: string; phone?: string } | null) => Promise<void> | void;
  onCheckoutStart?: () => void;
  theme?: 'dark' | 'light';
}> = ({ config, integrations, onStartCheckout, onCheckoutStart, theme = 'light' }) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Pix State
  const [pixCharge, setPixCharge] = useState<{ brCode: string; qrCodeImage: string; correlationID: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Poll for Pix Status
  useEffect(() => {
    if (!pixCharge || !open) return;

    const interval = setInterval(async () => {
      try {
        const res = await openPixCheckStatus(pixCharge.correlationID);
        if (res && res.charge && res.charge.status === 'COMPLETED') {
          // Payment confirmed!
          clearInterval(interval);
          finishPayment();
        }
      } catch (e) {
        // Ignore errors, just retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pixCharge, open]);

  const hasAnyContact = useMemo(() => {
    return Boolean(name.trim() || email.trim() || phone.trim());
  }, [name, email, phone]);

  const submit = async (allowSkip: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const contact =
        allowSkip || !hasAnyContact
          ? null
          : {
              name: name.trim() || undefined,
              email: email.trim() || undefined,
              phone: phone.trim() || undefined
            };
      
      // Se não for pular, criar cobrança Pix
      if (!allowSkip && contact) {
         try {
           const correlationID = `order-${Date.now()}-${Math.random().toString(36).substring(7)}`;
           const res = await openPixCharge({
             correlationID,
             value: config.valueCents,
             comment: `Pedido: ${config.productName}`,
             customer: {
               name: contact.name,
               email: contact.email,
               phone: contact.phone
             }
           });
           
           if (res && res.charge) {
             setPixCharge(res.charge);
             setSubmitting(false);
             return; // Stop here to show Pix
           }
         } catch (e) {
           console.error("Erro ao gerar Pix:", e);
           // Fallback or just proceed? Let's proceed for now if Pix fails or not configured
         }
      }

      await onStartCheckout(contact);
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      if (!pixCharge) {
        setSubmitting(false);
      }
    }
  };

  const handleCopyPix = () => {
    if (!pixCharge) return;
    navigator.clipboard.writeText(pixCharge.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishPayment = async () => {
    // Aqui idealmente verificaria o status do pagamento
    setSubmitting(true);
    await onStartCheckout({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined
    });
    setOpen(false);
    setSubmitting(false);
  };

  const openForm = () => {
    if (integrations?.externalPlatform?.enabled && integrations.externalPlatform.productId) {
      const { provider, productId, token } = integrations.externalPlatform;
      let url = '#';
      if (provider === 'hotmart') {
        url = `https://pay.hotmart.com/${productId}${token ? `?off=${token}` : ''}`;
      } else if (provider === 'kiwify') {
        url = `https://pay.kiwify.com.br/${productId}`;
      } else if (provider === 'perfectpay') {
        url = `https://perfectpay.com.br/checkout/${productId}`;
      }
      
      if (url !== '#') {
        onCheckoutStart?.();
        // Pequeno delay para garantir que o evento de tracking seja disparado/processado
        setTimeout(() => {
          window.location.href = url;
        }, 100);
        return;
      }
    }
    setOpen(true);
    onCheckoutStart?.();
  };

  if (!config) return <div className="p-4 text-center text-gray-500">Configuração não encontrada</div>;

  return (
    <div className={cn(
      "h-full w-full overflow-y-auto overflow-x-hidden pb-10 scrollbar-hide",
      theme === 'dark' ? "bg-neutral-950" : "bg-white"
    )}>
      {Array.isArray(config.blocks) && config.blocks.length > 0 ? (
        config.blocks.map((block, idx) => {
          if (!block) return null;
          return <BlockRenderer key={block.id || idx} block={block} openForm={openForm} theme={theme} />;
        })
      ) : (
        // Legacy Layout
        <>
          <header className={cn(
            "p-4 text-center border-b sticky top-0 z-10",
            theme === 'dark' ? "bg-pink-950/50 border-pink-900" : "bg-pink-50 border-pink-100"
          )}>
            <span className={cn(
              "font-bold tracking-wider text-xs uppercase",
              theme === 'dark' ? "text-pink-400" : "text-pink-600"
            )}>{config.headerLabel || ''}</span>
          </header>

          <div className="px-6 py-8 text-center max-w-full">
            <h1 className={cn(
              "text-2xl font-bold leading-tight mb-4",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>{config.headline || ''}</h1>
            <p className={cn(
              "text-sm mb-6",
              theme === 'dark' ? "text-gray-400" : "text-gray-600"
            )}>{config.subheadline || ''}</p>

            <div className={cn(
              "border-2 rounded-2xl p-6 relative mb-8 shadow-sm",
              theme === 'dark' ? "bg-pink-950/20 border-pink-900" : "bg-pink-50/50 border-pink-500"
            )}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                {config.badge || 'OFERTA'}
              </div>
              {config.productImageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden shadow-sm">
                  <img src={config.productImageUrl} alt={config.productName || 'Product'} className="w-full h-auto object-cover" />
                </div>
              )}
              <h2 className={cn("text-xl font-bold mb-2", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>{config.productName || ''}</h2>
              <div className="flex justify-center items-end gap-1 mb-4">
                {config.compareAtPrice && <span className="text-gray-400 text-lg line-through">{config.compareAtPrice}</span>}
                <span className="text-4xl font-extrabold text-pink-600">{config.price || ''}</span>
              </div>

              <button
                onClick={openForm}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-2 animate-bounce"
              >
                {config.primaryCtaText || 'Comprar Agora'}
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> {config.securePaymentText || 'Pagamento seguro'}
              </p>
            </div>
          </div>

          <div className="px-6 space-y-4 mb-10">
            <h3 className={cn("font-bold text-lg mb-2", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>O que você vai receber:</h3>
            {Array.isArray(config.bullets) && config.bullets.map((item, idx) => {
              if (!item) return null;
              return (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className={cn("text-sm", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>{item}</p>
              </div>
            );
            })}
          </div>

          <div className={cn(
            "p-8 text-center mx-4 rounded-2xl mb-6",
            theme === 'dark' ? "bg-neutral-800" : "bg-gray-50"
          )}>
            <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-gray-800")}>{config.guaranteeTitle || ''}</h4>
            <p className="text-gray-500 text-sm mt-2">{config.guaranteeText || ''}</p>
          </div>

          <div className="px-6 mt-8 mb-8">
            <h3 className={cn("font-bold text-lg mb-4 text-center", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>Quem já comprou e aprovou:</h3>
            <div className="space-y-4">
              {config.checkoutReviews?.map((review, idx) => {
                if (!review) return null;
                return (
                  <div key={idx} className={cn(
                    "border shadow-sm rounded-xl p-4",
                    theme === 'dark' ? "bg-neutral-800 border-neutral-700" : "bg-white border-gray-100"
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      <img src={review.avatarUrl || 'https://i.pravatar.cc/100'} alt="User" className="w-10 h-10 rounded-full" />
                      <div>
                        <p className={cn("font-bold text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{review.name}</p>
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className={cn("text-sm leading-snug", theme === 'dark' ? "text-gray-300" : "text-gray-600")}>{review.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 pt-0">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
              <span className="text-xs text-gray-400 ml-2">(4.8/5.0 avaliações)</span>
            </div>
            <button
              onClick={openForm}
              className="w-full bg-[#E91E63] text-white font-bold py-4 rounded-xl text-lg shadow-xl transform active:scale-95 transition-transform"
            >
              {config.secondaryCtaText || 'Comprar Agora'}
            </button>
          </div>

          <footer className="text-center text-gray-300 text-xs py-6">
            {config.footerLines?.map((line, idx) => (
              <p key={idx} className={idx === 0 ? '' : 'mt-1'}>
                {line}
              </p>
            ))}
          </footer>
        </>
      )}

      {/* Modal / Form Overlay */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)}></div>
          <div className={cn(
            "absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 shadow-2xl max-w-[430px] mx-auto animate-in slide-in-from-bottom duration-300",
            theme === 'dark' ? "bg-neutral-900" : "bg-white"
          )}>
            {pixCharge ? (
              <div className="flex flex-col items-center text-center">
                <div className="text-green-600 font-bold text-lg mb-1 flex items-center gap-2">
                   <CheckCircle className="w-5 h-5" /> Pagamento Pix
                </div>
                <div className={cn("text-sm mb-4", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>Escaneie o QR Code ou copie o código abaixo.</div>
                
                <div className={cn(
                  "w-48 h-48 rounded-xl mb-4 overflow-hidden border",
                  theme === 'dark' ? "bg-neutral-800 border-neutral-700" : "bg-gray-100 border-gray-200"
                )}>
                  {pixCharge.qrCodeImage ? (
                    <img src={pixCharge.qrCodeImage} alt="QR Code Pix" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">QR Code</div>
                  )}
                </div>

                <div className="w-full mb-4">
                  <div className="text-xs text-gray-500 uppercase font-bold mb-1 text-left">Pix Copia e Cola</div>
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={pixCharge.brCode} 
                      className={cn(
                        "flex-1 border rounded-lg px-3 py-2 text-xs outline-none",
                        theme === 'dark' ? "bg-neutral-800 border-neutral-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"
                      )}
                    />
                    <button 
                      onClick={handleCopyPix}
                      className={cn(
                        "p-2 rounded-lg transition-colors relative",
                        theme === 'dark' ? "bg-neutral-800 hover:bg-neutral-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      )}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={finishPayment}
                  disabled={submitting}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-lg shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Já realizei o pagamento'}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  Após pagar, clique no botão acima para liberar seu acesso.
                </p>
              </div>
            ) : (
              <>
                <div className={cn("font-bold text-lg mb-3", theme === 'dark' ? "text-white" : "text-gray-900")}>Antes de liberar o acesso</div>
                <div className={cn("text-sm mb-4", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>Preencha pelo menos 1 campo para eu te enviar o passo a passo.</div>
                <div className="space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-200",
                      theme === 'dark' ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-black"
                    )}
                    placeholder="Seu nome"
                    type="text"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-200",
                      theme === 'dark' ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-black"
                    )}
                    placeholder="WhatsApp"
                    type="tel"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-200",
                      theme === 'dark' ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-black"
                    )}
                    placeholder="E-mail"
                    type="email"
                  />
                  <button
                    disabled={submitting}
                    onClick={() => submit(false)}
                    className="w-full bg-[#E91E63] text-white font-bold py-3.5 rounded-xl text-lg shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => submit(true)}
                    className="w-full text-gray-500 font-semibold py-2 rounded-xl disabled:opacity-60"
                  >
                    Pular
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
