import axios from 'axios';
import { Requisition, Phase, Pendency } from '@prisma/client';

export type RawPhase = Omit<Phase, 'id' | 'requisitionId'>;
export type RawPendency = Omit<Pendency, 'id' | 'requisitionId'>;

type QueryResponse = {
  cs: {
    NumSolicitacao: string;
    NomeTipoSolicitacao: string;
    DataPagamento: string;
    DataEntrega: string;
    NomeApresentante: string;
    NomeParteInteressada: string;
  };
  movi: { DataSistema: string; NomeFase: string }[] | null;
  pend:
    | {
        NumeroSeqPendencia: number;
        TextoPendencia: string;
        DataPendencia: string;
        NumSolicitacao: string;
      }[]
    | null;
};

export class TerceiroClient {
  static async fetchRequisition(
    requisition: Pick<Requisition, 'number' | 'type' | 'password'>
  ): Promise<{ phases: RawPhase[]; pendencies: RawPendency[] }> {
    const payload = {
      NrSolicitacao: requisition.number,
      TipoSolicitacao: requisition.type,
      SenhaInternet: requisition.password,
    };
    const response = await this.getClient().post<QueryResponse>(
      '/Solicitacao/Consulta',
      payload
    );

    const { movi, pend } = response.data;
    return {
      phases: (movi || []).map(({ DataSistema, NomeFase }) => ({
        date: new Date(Date.parse(DataSistema)),
        description: NomeFase,
      })),
      pendencies: (pend || []).map(({ TextoPendencia, DataPendencia }) => ({
        description: TextoPendencia,
        date: new Date(Date.parse(DataPendencia)),
      })),
    };
  }

  private static getClient() {
    const API_URL = process.env.TERCEIRO_API_URL;
    if (!API_URL) throw new Error('TERCEIRO_API_URL is not defined');
    return axios.create({ baseURL: API_URL });
  }
}
