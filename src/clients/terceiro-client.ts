import axios from 'axios';
import { Requisition, Phase } from '@prisma/client';

const API_URL = process.env.NEXT_PUBLIC_TERCEIRO_API_URL;
if (!API_URL) throw new Error('NEXT_PUBLIC_TERCEIRO_API_URL is not defined');

const client = axios.create({ baseURL: API_URL });

export type RawPhase = Omit<Phase, 'id' | 'requisitionId'>;

type QueryResponse = {
  cs: {
    NumSolicitacao: string;
    NomeTipoSolicitacao: string;
    DataPagamento: string;
    DataEntrega: string;
    NomeApresentante: string;
    NomeParteInteressada: string;
  };
  movi: { DataSistema: string; NomeFase: string }[];
  pend: {
    NumeroSeqPendencia: number;
    TextoPendencia: string;
    DataPendencia: string;
    NumSolicitacao: string;
  }[];
};

export class TerceiroClient {
  static async fetchPhases(
    requisition: Pick<Requisition, 'number' | 'type' | 'password'>
  ): Promise<RawPhase[]> {
    const data = await this.fetchRequisition(requisition);
    return data.movi
      .map(({ DataSistema, NomeFase }) => ({
        date: new Date(Date.parse(DataSistema)),
        description: NomeFase,
      }))
      .reverse();
  }

  private static fetchRequisition(
    requisition: Pick<Requisition, 'number' | 'type' | 'password'>
  ): Promise<QueryResponse> {
    const payload = {
      NrSolicitacao: requisition.number,
      TipoSolicitacao: requisition.type,
      SenhaInternet: requisition.password,
    };
    return client
      .post<QueryResponse>('/Solicitacao/Consulta', payload)
      .then((response) => response.data);
  }
}
