declare const marked: {
  parse: (markdown: string) => string;
};

declare global {
  interface Window {
    PortalUtils: any;
    DocsPortalRouting: any;
    DocsPortalToc: any;
    DocsPortalSearch: any;
    DocsPortalEndpointDoc: any;
    DocsPortalScalarSync: any;
    DocsPortalSidebar: any;
    DocsPortalAuth: any;
    DocsPortalOpenApi: any;
  }
}

export {};
