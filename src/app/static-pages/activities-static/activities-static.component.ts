import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { IMyDpOptions, IMyDateModel } from 'mydatepicker';
import { NotifyService } from '../../core/notify.service';
import { ProjectPlanService } from '../../services/project-plan.service';
import { StaticPageBaseComponent } from './../static-page-base/static-page-base.component';
import { Subscription } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { LoggerService } from '../../services/logger/logger.service';
const swal = require('sweetalert');

@Component({
  selector: 'appdashboard-activities-static',
  templateUrl: './activities-static.component.html',
  styleUrls: ['./activities-static.component.scss']
})
export class ActivitiesStaticComponent extends StaticPageBaseComponent implements OnInit, OnDestroy {
  activities: any;
  agentAvailabilityOrRoleChange: string;
  agentDeletion: string;
  agentInvitation: string;
  newRequest: string;
  projectId: string;
  prjct_profile_type: string;
  subscription_is_active: any;
  prjct_profile_name: string;
  subscription_end_date: Date;
  browserLang: string;

  subscription: Subscription;

  USER_ROLE: string;
  onlyOwnerCanManageTheAccountPlanMsg: string;
  learnMoreAboutDefaultRoles: string;

  public myDatePickerOptions: IMyDpOptions = {
    // other options...
    dateFormat: 'dd/mm/yyyy',
    // dateFormat: 'yyyy, mm , dd',
  };

  constructor(
    private translate: TranslateService,
    public auth: AuthService,
    private router: Router,
    private prjctPlanService: ProjectPlanService,
    private notify: NotifyService,
    private usersService: UsersService,
    private logger: LoggerService
  ) {
    super();
  }

  ngOnInit() {
    this.buildActivitiesOptions();
    this.getCurrentProject();
    this.getBrowserLang();
    this.getProjectPlan();

    this.getProjectUserRole();
    this.getTranslationStrings();
  }

  getProjectUserRole() {
    this.usersService.project_user_role_bs.subscribe((user_role) => {
      this.USER_ROLE = user_role;
      this.logger.log('[ACTIVITIES-STATIC] - PROJECT USER ROLE: ', this.USER_ROLE);
    });
  }

  getTranslationStrings() {
    this.translateModalOnlyOwnerCanManageProjectAccount()
  }

  translateModalOnlyOwnerCanManageProjectAccount() {
    this.translate.get('OnlyUsersWithTheOwnerRoleCanManageTheAccountPlan')
      .subscribe((translation: any) => {
        // this.logger.log('PROJECT-EDIT-ADD  onlyOwnerCanManageTheAccountPlanMsg text', translation)
        this.onlyOwnerCanManageTheAccountPlanMsg = translation;
      });


    this.translate.get('LearnMoreAboutDefaultRoles')
      .subscribe((translation: any) => {
        // this.logger.log('PROJECT-EDIT-ADD  onlyOwnerCanManageTheAccountPlanMsg text', translation)
        this.learnMoreAboutDefaultRoles = translation;
      });
  }

  getBrowserLang() {
    this.browserLang = this.translate.getBrowserLang();
  }

  getProjectPlan() {
    this.subscription = this.prjctPlanService.projectPlan$.subscribe((projectProfileData: any) => {
      this.logger.log('[ACTIVITIES-STATIC] - GET PROJECT PROFILE', projectProfileData)
      if (projectProfileData) {

        this.prjct_profile_type = projectProfileData.profile_type;
        this.subscription_is_active = projectProfileData.subscription_is_active;

        this.subscription_end_date = projectProfileData.subscription_end_date

        this.prjct_profile_name = this.buildPlanName(projectProfileData.profile_name, this.browserLang, this.prjct_profile_type);

        if (this.prjct_profile_type === 'payment' && this.subscription_is_active === false) {

          if (this.USER_ROLE === 'owner') {
            this.notify.displaySubscripionHasExpiredModal(true, this.prjct_profile_name, this.subscription_end_date)
          }
        }
      }
     }, err => {
      this.logger.error('[ACTIVITIES-STATIC] GET PROJECT PROFILE - ERROR',err);
    }, () => {
      this.logger.log('[ACTIVITIES-STATIC] GET PROJECT PROFILE * COMPLETE *');
    });
  }


  goToPricing() {
    if (this.USER_ROLE === 'owner') {
      if (this.prjct_profile_type === 'payment' && this.subscription_is_active === false) {
        this.notify._displayContactUsModal(true, 'upgrade_plan');
      } else {
        this.router.navigate(['project/' + this.projectId + '/pricing']);
      }
    } else {
      this.presentModalOnlyOwnerCanManageTheAccountPlan();
    }
  }

  presentModalOnlyOwnerCanManageTheAccountPlan() {
    // https://github.com/t4t5/sweetalert/issues/845
    const el = document.createElement('div')
    el.innerHTML = this.onlyOwnerCanManageTheAccountPlanMsg + '. ' + "<a href='https://docs.tiledesk.com/knowledge-base/understanding-default-roles/' target='_blank'>" + this.learnMoreAboutDefaultRoles + "</a>"

    swal({
      // title: this.onlyOwnerCanManageTheAccountPlanMsg,
      content: el,
      icon: "info",
      // buttons: true,
      button: {
        text: "OK",
      },
      dangerMode: false,
    })
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getCurrentProject() {
    this.auth.project_bs.subscribe((project) => {
      this.logger.log('[ACTIVITIES-STATIC] - project ', project)

      if (project) {
        this.projectId = project._id
        this.logger.log('[ACTIVITIES-STATIC] - project id ', this.projectId)
      }
    });
  }


  buildActivitiesOptions() {
    this.translate.get('ActivitiesOptions')
      .subscribe((text: any) => {

        this.agentAvailabilityOrRoleChange = text.AgentAvailabilityOrRoleChange;
        this.agentDeletion = text.AgentDeletion;
        this.agentInvitation = text.AgentInvitation;
        this.newRequest = text.NewRequest;

        // this.logger.log('[ACTIVITIES-STATIC] - translateActivities AgentAvailabilityOrRoleChange ', text.AgentAvailabilityOrRoleChange)
        // this.logger.log('[ACTIVITIES-STATIC] - AgentDeletion ', text.AgentDeletion)
        // this.logger.log('[ACTIVITIES-STATIC] - AgentDeletion ', text.AgentInvitation)
        // this.logger.log('[ACTIVITIES-STATIC] - newRequest ', text.newRequest)
      }, (error) => {
        this.logger.error('[ACTIVITIES-STATIC] - GET translations error', error);
      }, () => {
        this.logger.log('[ACTIVITIES-STATIC] - GET translations * COMPLETE *');

        this.activities = [
          { id: 'PROJECT_USER_UPDATE', name: this.agentAvailabilityOrRoleChange },
          { id: 'PROJECT_USER_DELETE', name: this.agentDeletion },
          { id: 'PROJECT_USER_INVITE', name: this.agentInvitation },
          { id: 'REQUEST_CREATE', name: this.newRequest },
        ];
      });
  }




}
