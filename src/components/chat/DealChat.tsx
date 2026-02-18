import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AnalyzerContextType, AnalyzerPayload, DealDetail } from "@/types/deal-analyzer-types";
import type { AuditReport } from "@/types/scraper-audit-types";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface DealChatProps {
    contextType: AnalyzerContextType;
    dataPayload: AnalyzerPayload;
}

function isDealDetail(payload: AnalyzerPayload): payload is DealDetail {
    return "price" in payload && "title" in payload;
}

function buildGreeting(contextType: AnalyzerContextType, payload: AnalyzerPayload): string {
    if (contextType === "deal" && isDealDetail(payload)) {
        const deal = payload;
        const metricsLine = deal.metrics
            ? ` The asking price is **$${deal.price.toLocaleString()}** against an MAO of **$${deal.metrics.mao.toLocaleString()}** with **${deal.metrics.equityPercentage.toFixed(1)}% equity**.`
            : "";

        const details = [
            deal.address ? `Address: ${deal.address}` : null,
            deal.bedrooms ? `${deal.bedrooms} Beds` : null,
            deal.bathrooms ? `${deal.bathrooms} Baths` : null,
            deal.sqft ? `${deal.sqft.toLocaleString()} SqFt` : null
        ].filter(Boolean).join(" • ");

        return `I've loaded the full underwriting data for **${deal.title}** at **${deal.location}**.\n${details}\n${metricsLine}\n\nWhat would you like to know? I can analyze comps, renovation costs, exit strategies, or any specific risk factors.`;
    }

    // Audit context
    const audit = payload as AuditReport;
    const alertCount = audit.alerts.length;
    const criticalCount = audit.alerts.filter((a) => a.severity === "critical").length;
    return `I've reviewed the scrape audit report. Overall score: **${audit.overallScore}/100** — ${audit.pass ? "**PASS**" : "**REVIEW NEEDED**"}. There are **${alertCount} alerts** (${criticalCount} critical).\n\nAsk me about specific warnings, data integrity concerns, or how to resolve the flagged issues.`;
}

export function DealChat({ contextType, dataPayload }: DealChatProps) {
    const [chatInput, setChatInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { role: "assistant", content: buildGreeting(contextType, dataPayload) },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Reset chat when context changes
    useEffect(() => {
        setChatHistory([
            { role: "assistant", content: buildGreeting(contextType, dataPayload) },
        ]);
    }, [contextType, dataPayload]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory, isLoading]);

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
                    contextType,
                    deal: isDealDetail(dataPayload) ? dataPayload : undefined,
                    auditReport: !isDealDetail(dataPayload) ? dataPayload : undefined,
                    history: chatHistory,
                },
            });

            if (error) throw error;

            const reply = data?.reply || "I wasn't able to generate a response.";
            setChatHistory((prev) => [...prev, { role: "assistant", content: reply }]);
        } catch (err) {
            const errorDetails = err as any;
            console.error("[DealChat] Error details:", {
                message: errorDetails.message,
                status: errorDetails.status,
                code: errorDetails.code,
                fullError: err
            });

            toast.error(errorDetails.message || "Failed to get AI response. Please try again.");

            setChatHistory((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please check the console for details." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col bg-muted/10 h-full min-h-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-background">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    {contextType === "deal" ? "Deal Analyst" : "Audit Analyst"}
                </h3>
                <p className="text-xs text-muted-foreground">
                    {contextType === "deal"
                        ? "Ask about comps, zoning, renovation costs, or exit strategies."
                        : "Ask about flagged issues, data integrity, or how to resolve alerts."}
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4 min-h-0">
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
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background mt-auto">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        placeholder={contextType === "deal" ? "Ask about this deal..." : "Ask about these audit findings..."}
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
