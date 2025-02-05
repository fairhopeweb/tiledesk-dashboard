import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { UsersService } from '../services/users.service';
import { AuthService } from '../core/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { IMyDpOptions, IMyDateModel } from 'mydatepicker';
import { LocalDbService } from '../services/users-local-db.service';
import { BotLocalDbService } from '../services/bot-local-db.service';

import 'moment/locale/it.js';
import 'moment/locale/en-gb.js';
import { Subscription } from 'rxjs/Subscription';
import { LoggerService } from '../services/logger/logger.service';

@Component({
  selector: 'appdashboard-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss']
})

export class ActivitiesComponent implements OnInit, OnDestroy {
  @ViewChild('searchbtn') private searchbtnRef: ElementRef;
  @ViewChild('clearsearchbtn') private clearsearchbtnRef: ElementRef;
  @ViewChild('exportcsvbtn') private exportcsvbtnRef: ElementRef;


  projectId: string;
  projectUserIdOfcurrentUser: string;
  currentUserId: string;
  usersActivities: any;
  browser_lang: string;
  // showSpinner = true;
  showSpinner: boolean;
  pageNo = 0
  totalPagesNo_roundToUp: number;

  queryString: string;
  startDate: any;
  startDateValue: any;

  endDate: any;
  endDateValue: any;

  selectedAgentId: string;
  selectedAgentValue: string;

  agentsList = [];
  direction = -1;

  public myDatePickerOptions: IMyDpOptions = {
    // other options...
    dateFormat: 'dd/mm/yyyy',
    // dateFormat: 'yyyy, mm , dd',
  };

  selectedActivities: any;
  arrayOfSelectedActivity: any;
  hasAscDirection = false;
  activities: any;
  agentAvailabilityOrRoleChange: string;
  agentDeletion: string;
  agentInvitation: string;
  newRequest: string;
  asc: any;
  subscription: Subscription;
  projectUsersArray: any;
  objectKeys = Object.keys;
  constructor(
    private usersService: UsersService,
    public auth: AuthService,
    private translate: TranslateService,
    private router: Router,
    private usersLocalDbService: LocalDbService,
    private botLocalDbService: BotLocalDbService,
    private logger: LoggerService
  ) { }

  ngOnInit() {
    this.auth.checkRoleForCurrentProject();
    this.selectedAgentId = '';
    this.getBrowserLanguage();
    this.getCurrentProject();
    // this.getLoggedUserAndHisProjectUserId();
    this.getActivities();
    this.getCurrentUser();
    this.getAllProjectUsers();
    this.buildActivitiesOptions();
    // this.getProjectUsers();
  }

  ngOnDestroy() {
    this.logger.log('[ActivitiesComponent] % »»» WebSocketJs WF +++++ ws-requests--- activities ngOnDestroy')
    this.subscription.unsubscribe();
  }

  buildActivitiesOptions() {
    this.translate.get('ActivitiesOptions')
      .subscribe((text: any) => {
        // this.logger.log('translateActivities text ', text)
        this.agentAvailabilityOrRoleChange = text.AgentAvailabilityOrRoleChange;
        this.agentDeletion = text.AgentDeletion;
        this.agentInvitation = text.AgentInvitation;
        this.newRequest = text.NewRequest;
        // this.logger.log('translateActivities AgentAvailabilityOrRoleChange ', text.AgentAvailabilityOrRoleChange)
        // this.logger.log('translateActivities AgentDeletion ', text.AgentDeletion)
        // this.logger.log('translateActivities AgentDeletion ', text.AgentInvitation)
        // this.logger.log('translateActivities newRequest ', text.NewRequest)
      }, (error) => {
        this.logger.error('[ActivitiesComponent] - GET translations error ', error);
      }, () => {
        this.logger.log('[ActivitiesComponent] - GET translations * COMPLETE *');

        this.activities = [
          { id: 'PROJECT_USER_UPDATE', name: this.agentAvailabilityOrRoleChange },
          { id: 'PROJECT_USER_DELETE', name: this.agentDeletion },
          { id: 'PROJECT_USER_INVITE', name: this.agentInvitation },
          { id: 'REQUEST_CREATE', name: this.newRequest },
        ];
      });
  }

  getAllProjectUsers() {
    // createBotsAndUsersArray() {
    this.usersService.getProjectUsersByProjectId()
      .subscribe((projectUsers: any) => {
        this.logger.log('[ActivitiesComponent] - GET PROJECT-USERS ', projectUsers);

        if (projectUsers) {
          this.projectUsersArray = projectUsers;

          projectUsers.forEach(user => {
            this.logger.log('[ActivitiesComponent] - PROJECT-USER ', user);
            // tslint:disable-next-line:max-line-length
            this.agentsList.push({ '_id': user.id_user._id, 'firstname': user.id_user.firstname, 'lastname': user.id_user.lastname });
          });

          // this.logger.log('!!! NEW REQUESTS HISTORY  - !!!! USERS ARRAY ', this.user_and_bot_array);

        }
      }, (error) => {
        this.logger.error('[ActivitiesComponent] - GET PROJECT-USERS ', error);
      }, () => {
        this.logger.log('[ActivitiesComponent] - GET PROJECT-USERS * COMPLETE *');

      });

  }


  getBrowserLanguage() {
    this.browser_lang = this.translate.getBrowserLang();
    this.logger.log('[ActivitiesComponent] - browser_lang ', this.browser_lang)
  }

  getCurrentProject() {
    this.subscription = this.auth.project_bs.subscribe((project) => {
      if (project) {
        this.projectId = project._id
        this.logger.log('[ActivitiesComponent] - projectId ', this.projectId)
      }
    });
  }

  getCurrentUser() {
    this.auth.user_bs.subscribe((user) => {
      this.logger.log('[ActivitiesComponent] - LoggedUser ', user);

      if (user && user._id) {
        this.currentUserId = user._id;
      }
    });
  }

  search() {
    // RESOLVE THE BUG: THE BUTTON SEARCH REMAIN FOCUSED AFTER PRESSED
    this.searchbtnRef.nativeElement.blur();
    this.pageNo = 0

    this.getQueryStringValues();

    this.queryString =
      'start_date=' + this.startDateValue + '&' +
      'end_date=' + this.endDateValue + '&' +
      'agent_id=' + this.selectedAgentValue + '&' +
      'activities=' + this.arrayOfSelectedActivity + '&' +
      'direction=' + this.direction


    this.getActivities();
  }

  clearSearch() {
    // RESOLVE THE BUG: THE BUTTON CLEAR SEARCH REMAIN FOCUSED AFTER PRESSED
    this.clearsearchbtnRef.nativeElement.blur();

    this.pageNo = 0;

    this.startDate = '';
    this.endDate = '';
    this.selectedActivities = '';
    this.selectedAgentId = '';

    this.queryString =
      'start_date=' + '&' +
      'end_date=' + '&' +
      'agent_id=' + '&' +
      'activities=' + '&' +
      'direction=' + this.direction;

    this.getActivities();
  }


  sortDirection(_hasAscDirection: boolean) {
    this.hasAscDirection = _hasAscDirection;

    this.getQueryStringValues();

    this.queryString =
      'start_date=' + this.startDateValue + '&' +
      'end_date=' + this.endDateValue + '&' +
      'agent_id=' + this.selectedAgentValue + '&' +
      'activities=' + this.arrayOfSelectedActivity + '&' +
      'direction=' + this.direction


    this.getActivities();
  }


  exportActivitiesAsCSV() {
    // RESOLVE THE BUG: THE BUTTON REMAIN FOCUSED AFTER PRESSED
    this.exportcsvbtnRef.nativeElement.blur();

    this.usersService.downloadActivitiesAsCsv(this.queryString, 0, this.browser_lang)
      .subscribe((res: any) => {
        this.logger.log('[ActivitiesComponent] - downloadActivitiesAsCsv - res ', res);

        if (res) {
          this.downloadFile(res)
        }

      }, (error) => {

        this.logger.error('[ActivitiesComponent] - downloadActivitiesAsCsv - ERROR ', error);
      }, () => {
        this.logger.log('[ActivitiesComponent] - downloadActivitiesAsCsv * COMPLETE *');

      });
  }

  downloadFile(data) {
    const blob = new Blob(['\ufeff' + data], { type: 'text/csv;charset=utf-8;' });
    const dwldLink = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const isSafariBrowser = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    if (isSafariBrowser) {  // if Safari open in new window to save file with random filename.
      dwldLink.setAttribute('target', '_blank');
    }
    dwldLink.setAttribute('href', url);
    dwldLink.setAttribute('download', 'activities.csv');
    dwldLink.style.visibility = 'hidden';
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  getQueryStringValues() {
    if (this.startDate) {
      this.logger.log('[ActivitiesComponent] - search START DATE ', this.startDate);
      this.logger.log('[ActivitiesComponent] - search START DATE - FORMATTED ', this.startDate['formatted']);

      this.startDateValue = this.startDate['formatted']
    } else {
      this.startDateValue = '';
      this.logger.log('[ActivitiesComponent] - search START DATE ', this.startDate);
    }

    if (this.endDate) {
      this.logger.log('[ActivitiesComponent] - END DATE ', this.endDate);
      this.logger.log('[ActivitiesComponent] - END DATE - FORMATTED ', this.endDate['formatted']);


      this.endDateValue = this.endDate['formatted']

      this.logger.log('[ActivitiesComponent] - SEARCH FOR END DATE ', this.endDateValue);
    } else {
      this.endDateValue = '';
      this.logger.log('[ActivitiesComponent] - SEARCH FOR END DATE ', this.endDate)
    }

    if (this.selectedAgentId) {

      this.selectedAgentValue = this.selectedAgentId;
      this.logger.log('[ActivitiesComponent] - SEARCH FOR selectedAgentId ', this.selectedAgentValue);
    } else {
      this.logger.log('[ActivitiesComponent] - SEARCH FOR selectedAgentId ', this.selectedAgentId);
      this.selectedAgentValue = '';
    }

    if (this.selectedActivities) {
      this.logger.log('[ActivitiesComponent] - search ***** selectedActivities *****', this.selectedActivities);
      this.arrayOfSelectedActivity = this.selectedActivities;
      this.logger.log('[ActivitiesComponent] - search ***** arrayOfSelectedActivity *****', this.arrayOfSelectedActivity);
    } else {
      this.arrayOfSelectedActivity = '';
    }

    this.logger.log('[ActivitiesComponent] - hasAscDirection ', this.hasAscDirection);
    if (this.hasAscDirection === true) {
      this.direction = 1
    } else {
      this.direction = -1
    }

  }


  getActivities() {
    this.showSpinner = true;
    this.usersService.getUsersActivities(this.queryString, this.pageNo)
      .subscribe((res: any) => {
        this.logger.log('[ActivitiesComponent] - getActivities - **** RESPONSE **** ', res);
        if (res) {
          const perPage = res.perPage;
          const count = res.count;
          this.logger.log('[ActivitiesComponent] - getActivities RESPONSE - per Page ', perPage);
          this.logger.log('[ActivitiesComponent] - getActivities RESPONSE - count ', count);



          const totalPagesNo = count / perPage;
          this.logger.log('[ActivitiesComponent] - TOTAL PAGES NUMBER', totalPagesNo);

          this.totalPagesNo_roundToUp = Math.ceil(totalPagesNo);
          this.logger.log('[ActivitiesComponent] - TOTAL PAGES No ROUND TO UP ', this.totalPagesNo_roundToUp);

          if (res.activities) {
            this.usersActivities = res.activities;
            this.usersActivities.forEach((activity: any) => {
              this.logger.log('[ActivitiesComponent] - getActivities RESPONSE - activity ', activity);

              if (activity && activity.verb && activity.verb === 'PROJECT_USER_UPDATE') {
                if (activity.actor &&
                  activity.actor.id &&
                  activity.target &&
                  activity.target.object &&
                  activity.target.object.id_user &&
                  activity.target.object.id_user._id) {


                  if (activity.actor.id === activity.target.object.id_user._id) {
                    activity.targetOfActionIsYourself = true;
                  } else {
                    activity.targetOfActionIsYourself = false;
                  }
                }
              }

              // moment.locale('en-gb')
              if (this.browser_lang === 'it') {
                moment.locale('it')
                const date = moment(activity.updatedAt).format('dddd, DD MMM YYYY - HH:mm:ss');
                this.logger.log('[ActivitiesComponent] - getActivities - updatedAt date', date);
                activity.date = date;
              } else {
                const date = moment(activity.updatedAt).format('dddd, MMM DD, YYYY - HH:mm:ss');
                this.logger.log('[ActivitiesComponent] - getActivities - updatedAt date', date);
                activity.date = date;
              }

              // used for the new request
              if (activity && activity.target && activity.target.object && activity.target.object.first_text) {

                this.logger.log('[ActivitiesComponent] - getActivities - first_text:  ', activity.target.object.first_text);

                if (activity.target.object.first_text.length >= 30) {

                  activity.activity_request_text = activity.target.object.first_text.slice(0, 30) + '...';

                } else {
                  activity.activity_request_text = activity.target.object.first_text
                }

                if (activity.target && activity.target.object && activity.target.object.status === 200) {

                  if (activity.target && activity.target.object && activity.target.object.participants) {

                    const participantId = activity.target.object.participants[0]
                    this.logger.log('ActivitiesComponent participant ', participantId);

                    if (participantId && participantId.includes('bot_')) {
                      this.logger.log('[ActivitiesComponent] participant includes bot with id ', participantId);
                      const bot_id = participantId.slice(4);
                      this.logger.log('[ActivitiesComponent] participant includes bot with id slice(4)', bot_id);

                      let bot: any

                      setTimeout(() => {
                        bot = this.botLocalDbService.getBotFromStorage(bot_id);
                        this.logger.log('[ActivitiesComponent] participant bot', bot);
                        if (bot) {
                          let botType = "";
                          if (bot.type === 'internal') {

                            botType = 'native'
                          } else {
                            botType = bot.type
                          }
                          activity.participant_fullname = bot.name + ` (${botType} bot)`
                          this.logger.log('[ActivitiesComponent] participant bot name', activity.participant_fullname);
                        }
                      }, 50);
                   
                    } else {

                      const user = this.usersLocalDbService.getMemberFromStorage(participantId);
                      this.logger.log('[ActivitiesComponent] participant - user', user);

                      if (user !== null) {
                        activity.participant_fullname = user.firstname + ' ' + user.lastname
                      } else {
                        activity.participant_fullname = 'n.d.'
                      }
                    }
                  }
                }
              }
            });
          }
        }

      }, (error) => {
        this.showSpinner = false;
        this.logger.error('[ActivitiesComponent] - getActivities - ERROR ', error);
      }, () => {
        this.logger.log('[ActivitiesComponent] - getActivities * COMPLETE *');
        this.showSpinner = false;
      });
  }

  /// PAGINATION
  decreasePageNumber() {
    this.pageNo -= 1;

    this.logger.log('[ActivitiesComponent] - DECREASE PAGE NUMBER ', this.pageNo);
    this.getActivities();
  }

  increasePageNumber() {
    this.pageNo += 1;

    this.logger.log('[ActivitiesComponent] - INCREASE PAGE NUMBER ', this.pageNo);
    this.getActivities();
  }

  goToMemberProfile(participantId: any) {
    if (participantId.includes('bot_')) {
      const bot_id = participantId.slice(4);
      const bot = this.botLocalDbService.getBotFromStorage(bot_id);

      let botType = ''
      if (bot.type === 'internal') {
        botType = 'native'
      } else {
        botType = bot.type
      }

      this.router.navigate(['project/' + this.projectId + '/bots', bot_id, botType]);

    } else {

      this.logger.log('[ActivitiesComponent] has clicked GO To MEMBER ', participantId);
      // this.router.navigate(['project/' + this.projectId + '/member/' + participantId]);
  
      const filteredProjectUser = this.projectUsersArray.filter((obj: any) => {
        return obj.id_user._id === participantId;
      });

      this.logger.log('[ActivitiesComponent] - filteredProjectUser ', filteredProjectUser[0]._id);
      this.router.navigate(['project/' + this.projectId + '/user/edit/' + filteredProjectUser[0]._id]);
    }

  }

  goToRequestDetails(request_id) {
    this.logger.log('[ActivitiesComponent] has clicked GO To REQUEST DETAILS ', request_id);
    this.router.navigate(['project/' + this.projectId + '/wsrequest/' + request_id + '/messages']);

  }
}
