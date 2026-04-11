import passport from 'passport';
import { Request } from 'express';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Role } from '@prisma/client';
import prisma from './prisma';
import config from './env';

const OAUTH_SIGNUP_ROLES: Role[] = [
  Role.CUSTOMER,
  Role.PROVIDER,
  Role.MANAGER,
  Role.ORGANIZER,
];

function roleFromGoogleOAuthState(req: Request): Role {
  const raw = typeof req.query.state === 'string' ? req.query.state : undefined;
  if (raw && OAUTH_SIGNUP_ROLES.includes(raw as Role)) return raw as Role;
  return Role.CUSTOMER;
}

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt_secret as string,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: jwt_payload.id },
        include: { providerProfile: true }
      });

      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id as string,
      clientSecret: config.google_client_secret as string,
      callbackURL: config.google_callback_url as string,
      passReqToCallback: true,
    },
    async (req: Request, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in our db
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
          include: { providerProfile: true }
        });

        if (user) {
          // User already exists, return user
          return done(null, user);
        }

        // Check if email already exists
        user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0]?.value },
          include: { providerProfile: true }
        });

        if (user) {
          // User exists with same email, link Google account
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id },
            include: { providerProfile: true }
          });
          return done(null, user);
        }

        let newRole = roleFromGoogleOAuthState(req);
        // Provider accounts need a profile; OAuth has no shop details — keep as customer
        if (newRole === Role.PROVIDER) {
          newRole = Role.CUSTOMER;
        }

        // Create new user
        user = await prisma.user.create({
          data: {
            name: profile.displayName || profile.emails?.[0]?.value || 'Google User',
            email: profile.emails?.[0]?.value || '',
            password: '', // No password for OAuth users
            googleId: profile.id,
            role: newRole,
          },
          include: { providerProfile: true }
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
