import { Component, ViewContainerRef, ViewChild, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';

import { ToastService } from './services/toast.service';
import { AuthService } from './services/auth.service';
import { ACLService } from './services/acl.service';

import { ConfigService } from 'config/config';

import * as packageJSON from "../../package.json";
import { config } from 'process';

class LoginData {
	login: string = "";
	password: string = "";
}

@Component({
	selector: 'cityvizor-app',
	templateUrl: 'app.component.html',
	styleUrls: ['app.component.scss'],
	animations: [
		trigger("toastsFadeOut", [
			transition(':leave', animate(250, style({ opacity: 0 }))) // * => void
		])
	]
})
export class AppComponent {

	private viewContainerRef: ViewContainerRef; // ng2-bootstrap requirement

	// array to link toasts from toastService
	toasts: Array<any>;

	version = packageJSON.version;

	wrongPassword: boolean = false;

	alternativeFooterHtml: string;

	constructor(private toastService: ToastService, public authService: AuthService, public aclService: ACLService, private router: Router, private route: ActivatedRoute, public configService: ConfigService) {
		this.toasts = this.toastService.toasts;
		this.alternativeFooterHtml = this.configService.config.alternativePageContent.footerHtml
	}

	ngOnInit() {
	}

	logout() {
		this.router.navigate(['/login']);
		this.authService.logout();
	}


}