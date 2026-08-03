import React from 'react';
import { Document } from '@react-pdf/renderer';
import { Customer, Bank, CompanySettings, Location } from '@/types';
import { Lampiran1 } from './lampiran/Lampiran1';
import { Lampiran2 } from './lampiran/Lampiran2';
import { Lampiran3 } from './lampiran/Lampiran3';
import { Lampiran5 } from './lampiran/Lampiran5';
import { Lampiran11 } from './lampiran/Lampiran11';

interface Props {
  customer: Customer;
  bank?: Bank;
  companySettings: CompanySettings | null;
  location: Location | null;
  tanggalCetak: string;
  sertakanLampiran5: boolean;
  namaPejabatBank: string;
  jabatanPejabatBank: string;
  cabangPKS: string;
  nomorPKS: string;
  tanggalPKS: string;
}

export const PersyaratanKprBundle = ({
  customer,
  bank,
  companySettings,
  location,
  tanggalCetak,
  sertakanLampiran5,
  namaPejabatBank,
  jabatanPejabatBank,
  cabangPKS,
  nomorPKS,
  tanggalPKS
}: Props) => {
  return (
    <Document>
      <Lampiran1 customer={customer} tanggalCetak={tanggalCetak} />
      <Lampiran2 customer={customer} bank={bank} tanggalCetak={tanggalCetak} />
      <Lampiran3 
        customer={customer} 
        bank={bank} 
        tanggalCetak={tanggalCetak}
        namaPejabatBank={namaPejabatBank}
        jabatanPejabatBank={jabatanPejabatBank}
      />
      {sertakanLampiran5 && (
        <Lampiran5 customer={customer} tanggalCetak={tanggalCetak} />
      )}
      <Lampiran11 
        companySettings={companySettings} 
        location={location} 
        tanggalCetak={tanggalCetak}
        cabangPKS={cabangPKS}
        nomorPKS={nomorPKS}
        tanggalPKS={tanggalPKS}
      />
    </Document>
  );
};
