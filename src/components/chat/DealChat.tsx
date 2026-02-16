import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DealDetail } from "@/components/modals/DealDetailModal";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface DealChatProps {
    deal: DealDetail;
}

export function DealChat({ deal }: DealChatProps) {
    const [chatInput, setChatInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        {
            role: "assistant",
            content: `I've loaded the full underwriting data for **${deal.title}** at **${deal.location}**.${deal.metrics ? ` The asking price is **$${deal.price.toLocaleString()}** against an MAO of **$${deal.metrics.mao.toLocaleString()}** with **${deal.metrics.equityPercentage.toFixed(1)}% equity**.` : ""}\n\nWhat would you like to know? I can analyze comps, renovation costs, exit strategies, or any specific risk factors.`,
        },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = chatInput.trim();
        if (!trimmed || isLoading) return;

        const userMessage: ChatMessage = { role: "user", content: trimmed };
        setChatHistory((prev) => [...prev, userMessage]);
        setChatInput("");
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke("deal-analyzer", {
                body: {
                    message: trimmed,
                    deal,
                    history: chatHistory,
                },
            });

            if (error) throw error;

            const reply = data?.reply || "I wasn't able to generate a response.";
            setChatHistory((prev) => [...prev, { role: "assistant", content: reply }]);
        } catch (err) {
            console.error("[DealChat] Error:", err);
            toast.error("Failed to get AI response. Please try again.");
            setChatHistory((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col bg-muted/10 h-full">
            {/* Header */}
            <div className="p-4 border-b bg-background">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" /> Deal Analyst
                </h3>
                <p className="text-xs text-muted-foreground">
                    Ask about comps, zoning, renovation costs, or exit strategies.
                </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="p-4 space-y-4">
                    {chatHistory.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.role === "assistant" && (
                                <Avatar className="w-8 h-8 border shrink-0">
                                    <AvatarFallback>
                                        <Bot className="w-4 h-4" />
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={`p-3 rounded-lg max-w-[85%] text-sm whitespace-pre-wrap ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted rounded-tl-none"
                                    }`}
                            >
                                {msg.content}
                            </div>
                            {msg.role === "user" && (
                                <Avatar className="w-8 h-8 border shrink-0">
                                    <AvatarFallback>
                                        <User className="w-4 h-4" />
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <Avatar className="w-8 h-8 border shrink-0">
                                <AvatarFallback>
                                    <Bot className="w-4 h-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="p-3 rounded-lg bg-muted rounded-tl-none flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background mt-auto">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        placeholder="Ask about this deal..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !chatInput.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
