import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Comment, roleConfig } from "@/lib/mock-data";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface CommentSectionProps {
  ticketId: string;
  comments: Comment[];
  ticketCreatedBy: string;
  onCommentAdded?: (comment: Comment) => void;
}

export function CommentSection({
  ticketId,
  comments: initialComments,
  ticketCreatedBy,
  onCommentAdded,
}: CommentSectionProps) {
  const { addComment } = useApp();
  const { user } = useAuth();
  const currentUser = user?.name ?? "Usuário";
  const role = user?.role ?? "user";
  const [text, setText] = useState("");
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addComment(ticketId, text);
      const newComment: Comment = {
        id: `c-${Date.now()}`,
        author: currentUser,
        authorRole: role,
        content: text,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, newComment]);
      onCommentAdded?.(newComment);
      setText("");
      toast.success("Comentário enviado.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar comentário.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
        <MessageSquare className="h-4 w-4" /> Comentários ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhum comentário ainda.</p>
      )}

      <div className="space-y-3">
        {comments.map((c) => {
          const isRequester = c.author === ticketCreatedBy;
          const roleCfg = roleConfig[c.authorRole] || roleConfig["user"];
          return (
            <div
              key={c.id}
              className={`rounded-lg p-3 space-y-1.5 border ${
                isRequester
                  ? "bg-muted/40 border-border ml-0 mr-8"
                  : "bg-primary/5 border-primary/10 ml-8 mr-0"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {c.author.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-foreground">{c.author}</span>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${roleCfg.class}`}>
                    {roleCfg.label}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{c.content}</p>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escrever comentário..."
          rows={2}
          className="flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={sending}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="h-auto self-end"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
