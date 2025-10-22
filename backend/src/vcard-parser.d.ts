declare module 'vcard-parser' {
  interface VCard {
    n?: string | string[] | { familyName?: string; givenName?: string; [key: string]: any };
    fn?: string | string[];
    email?: string | string[] | { value?: string; [key: string]: any }[];
    tel?: string | string[] | { value?: string; [key: string]: any }[];
    [key: string]: any;
  }

  interface VCardParser {
    parse(vcfContent: string): VCard | VCard[];
  }

  const parser: VCardParser;
  export default parser;
}
