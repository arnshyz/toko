// types/iron-session.d.ts
import 'iron-session';

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: string;
      name: string;
      email: string;
      slug: string;
      isAdmin: boolean;
    };
  }
}
