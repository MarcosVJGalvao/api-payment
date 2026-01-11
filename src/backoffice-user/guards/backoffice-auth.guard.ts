import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class BackofficeAuthGuard extends AuthGuard('jwt-backoffice') {}
