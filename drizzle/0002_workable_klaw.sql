CREATE TYPE "public"."status_solicitacao" AS ENUM('pendente', 'respondida', 'cancelada');--> statement-breakpoint
CREATE TABLE "solicitacoes_orcamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"servico_id" uuid NOT NULL,
	"descricao" text NOT NULL,
	"data_solicitacao" timestamp with time zone NOT NULL,
	"status" "status_solicitacao" DEFAULT 'pendente' NOT NULL,
	"fotos" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "solicitacoes_orcamento" ADD CONSTRAINT "solicitacoes_orcamento_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_orcamento" ADD CONSTRAINT "solicitacoes_orcamento_servico_id_services_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;