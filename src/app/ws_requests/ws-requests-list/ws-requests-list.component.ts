import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ViewChild, ElementRef, HostListener, ViewEncapsulation } from '@angular/core';
import { WsRequestsService } from '../../services/websocket/ws-requests.service';
import { LocalDbService } from '../../services/users-local-db.service';
import { BotLocalDbService } from '../../services/bot-local-db.service';
import { Router, NavigationStart, NavigationEnd, NavigationExtras, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { avatarPlaceholder, getColorBck } from '../../utils/util';
import { NotifyService } from '../../core/notify.service';

import { TranslateService } from '@ngx-translate/core';
import { WsSharedComponent } from '../ws-shared/ws-shared.component';
import { Request } from '../../models/request-model';
import { UsersService } from '../../services/users.service';
import { UAParser } from 'ua-parser-js'
import { FaqKbService } from '../../services/faq-kb.service';

import 'rxjs/add/observable/of';
import { AppConfigService } from '../../services/app-config.service';
import { Subscription } from 'rxjs/Subscription';

import { DepartmentService } from '../../services/department.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators'

import { browserRefresh } from '../../app.component';
import * as uuid from 'uuid';
import { Chart } from 'chart.js';
import { ContactsService } from '../../services/contacts.service';
import { Observable } from 'rxjs';
import { ProjectUser } from '../../models/project-user';
import { ProjectService } from '../../services/project.service';
import { ProjectPlanService } from '../../services/project-plan.service';
import { LoggerService } from '../../services/logger/logger.service';
const swal = require('sweetalert');
// import {Observable,of, empty} from 'rxjs'

@Component({
  selector: 'appdashboard-ws-requests-list',
  templateUrl: './ws-requests-list.component.html',
  styleUrls: ['./ws-requests-list.component.scss']
  // ,
  // encapsulation: ViewEncapsulation.None
})
export class WsRequestsListComponent extends WsSharedComponent implements OnInit, AfterViewInit, OnDestroy {

  // CHAT_BASE_URL = environment.chat.CHAT_BASE_URL; // moved
  // CHAT_BASE_URL = environment.CHAT_BASE_URL; // now get from appconfig
  CHAT_BASE_URL: string;

  // used to unsuscribe from behaviour subject
  private unsubscribe$: Subject<any> = new Subject<any>();


  // @ViewChild('teamContent', { read: ElementRef }) public teamContent: ElementRef<any>;
  @ViewChild('teamContent') private teamContent: ElementRef;
  @ViewChild('testwidgetbtn') private testwidgetbtnRef: ElementRef;
  @ViewChild('widgetsContent') public widgetsContent: ElementRef;
  // wsRequestsUnserved: Observable<Request[]>;
  // wsRequestsServed: Observable<Request[]>;
  wsRequestsUnserved: any;
  wsRequestsServed: any;
  ws_requests: any;
  projectId: string;
  zone: NgZone;
  SHOW_SIMULATE_REQUEST_BTN = false;
  showSpinner = true;
  firebase_token: any;
  currentUserID: string;
  ONLY_MY_REQUESTS: boolean = false;
  ROLE_IS_AGENT: boolean;
  displayBtnLabelSeeYourRequets = false;

  totalRequests: any;
  i = 0
  Xlength: number

  user_and_bot_array = [];
  team_ids_array = [];

  seeAll: any;
  subscription: Subscription;
  storageBucket: string;

  departments: any;
  selectedDeptId: string;
  selectedAgentId: any;

  // TESTSITE_BASE_URL = environment.testsite.testsiteBaseUrl; // moved
  // TESTSITE_BASE_URL = environment.testsiteBaseUrl;   // now get from appconfig
  TESTSITE_BASE_URL: string;
  projectName: string;

  participantsInRequests: any;
  deptsArrayBuildFromRequests: any;

  filter: any[] = [{ 'deptId': null }, { 'agentId': null }];
  hasFiltered = false;
  public browserRefresh: boolean;
  displayInternalRequestModal = 'none';
  internalRequest_subject: string;
  // internalRequest_deptId: string;
  internalRequest_message: string;
  showSpinner_createInternalRequest = false;
  hasClickedCreateNewInternalRequest = false;
  createNewInternalRequest_hasError: boolean;
  internal_request_id: string;

  displayCreateNewUserModal = 'none';

  // deptIdSelectedInRequuestsXDepts
  ws_requestslist_deptIdSelected: string
  display_dept_sidebar = false;
  imageStorage$: string;
  baseUrl: string;
  UPLOAD_ENGINE_IS_FIREBASE: boolean;

  OPERATING_HOURS_ACTIVE: boolean;
  served_unserved_sum: any;

  displayRequestsMap: boolean = false;
  OPEN_RIGHT_SIDEBAR: boolean = false;
  map_sidebar_height: any;

  projectUserArray: Array<any> = []
  tempProjectUserArray: Array<any> = []

  project_user_length: number;
  display_teammates_in_scroll_div = false;
  showRealTeammates = false

  projectUserAndLeadsArray = []
  projectUserBotsAndDeptsArray = []
  cars: any
  selectedRequester: any;
  selectedCar: number;
  page_No = 0
  items = [];
  HAS_CLICKED_CREATE_NEW_LEAD: boolean = false;
  HAS_COMPLETED_CREATE_NEW_LEAD: boolean = false;
  new_user_name: string;
  new_user_email: string;
  assignee_id: string

  assignee_participants_id: string;
  assignee_dept_id: string;
  loadingAssignee: boolean;
  loadingRequesters: boolean;
  new_requester_email_is_valid: boolean;
  newRequesterCreatedSuccessfullyMsg: string;

  requester_type: string;
  id_for_view_requeter_dtls: string

  project_users: ProjectUser[]
  other_project_users_that_has_abandoned_array: Array<any>

  CHAT_REASSIGNMENT_IS_ENABLED: boolean // reassignment_on
  reassignment_timeout: number; // reassignment_delay
  CHAT_LIMIT_IS_ENABLED: boolean // key chat_limit_on
  maximum_chats: number; // key max_agent_assigned_chat
  AUTOMATIC_UNAVAILABLE_STAUS_IS_ENABLED: boolean; // automatic_unavailable_status_on
  chats_reassigned: number // key automatic_idle_chats
  // DISPLAY_MODAL_UPGRADE_PLAN: boolean; // NOT USED
  // DISPLAY_MODAL_SUBSCRIPTION_PROBLEM: boolean; // NOT USED
  CURRENT_USER_ROLE: string;
  agentCannotManageAdvancedOptions: string;
  learnMoreAboutDefaultRoles: string;
  featureIsAvailableWithTheProPlan: string;

  prjct_profile_name: string;
  subscription_end_date: any;

  public_Key: string;
  isVisibleSmartAssignOption: boolean;
  isVisibleOPH: boolean;
  prjct_profile_type: string;
  prjct_trial_expired: boolean;
  subscription_is_active: boolean;
  DISPLAY_OPH_AS_DISABLED: boolean;
  project_id: string;




  constructor(
    public wsRequestsService: WsRequestsService,
    public router: Router,
    public usersLocalDbService: LocalDbService,
    public botLocalDbService: BotLocalDbService,
    public auth: AuthService,
    private translate: TranslateService,
    public usersService: UsersService,
    public faqKbService: FaqKbService,
    public appConfigService: AppConfigService,
    private departmentService: DepartmentService,
    public notify: NotifyService,
    public contactsService: ContactsService,
    private projectService: ProjectService,
    private prjctPlanService: ProjectPlanService,
    public logger: LoggerService
  ) {
    super(botLocalDbService, usersLocalDbService, router, wsRequestsService, faqKbService, usersService, notify, logger);
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit() {
    this.getOSCODE();
    // this.getStorageBucketFromUserServiceSubscription();
    this.getImageStorageAndThenProjectUsers();
    /* getDepartments da valutare se viene ancora usato (veniva usato di sicuro durante la creazione della richiesta interna ora sosstiuiyo con
     // getProjectUserAndBotAndDepts x dare la possibilità di associare una richiesta interna oltre che ad un dept anche ad un bot o a un projct-user) */
    this.getDepartments();
    // this.getActiveContacts();
    // this.getWsRequests$();
    this.getCurrentProjectAndThenDetProjectById();
    this.getProjectPlan();
    this.getLoggedUser();
    this.getProjectUserRole();


    // this.for1();
    // this.getRequestsTotalCount()  
    // this.getAllProjectUsersAndBot();

    // const teamContentEl = <HTMLElement>document.querySelector('.team-content');
    // const perfs = new PerfectScrollbar(teamContentEl);
    // this.selectedDeptId = '';
    // this.selectedAgentId = '';
    this.detectBrowserRefresh();

    this.getChatUrl();
    this.getTestSiteUrl();
    // this.getProjectUsersAndContacts();
    // this.getProjectUserBotsAndDepts();

    // this.getAllPaginatedContactsRecursevely(this.page_No)
    this.translateString()
  }

  // getActiveContacts() {
  //   this.contactsService.getLeadsActive().subscribe((activeleads: any) => {
  //     this.logger.log('WS-REQUEST-LIST - GET ACTIVE LEADS RES ', activeleads)

  //   });
  // }

  ngAfterViewInit() { }

  ngOnDestroy() {
    this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list ≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥ ngOnDestroy')
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    this.projectUserArray.forEach(projectuser => {
      this.wsRequestsService.unsubsToToWsAllProjectUsersOfTheProject(projectuser.id_user._id)
    });
  }

  getProjectPlan() {
    this.subscription = this.prjctPlanService.projectPlan$.subscribe((projectProfileData: any) => {
      this.logger.log('ProjectPlanService (WS-REQUEST-LIST) project Profile Data', projectProfileData)
      if (projectProfileData) {
        this.project_id = projectProfileData._id;
        this.prjct_trial_expired = projectProfileData.trial_expired;
        this.prjct_profile_type = projectProfileData.profile_type;
        this.subscription_is_active = projectProfileData.subscription_is_active;


        if (this.prjct_profile_type === 'payment' && this.subscription_is_active === false || this.prjct_profile_type === 'free' && this.prjct_trial_expired === true) {
          this.DISPLAY_OPH_AS_DISABLED = true;
        } else {
          this.DISPLAY_OPH_AS_DISABLED = false;
        }
      }
    })
  }


  getOSCODE() {

    this.public_Key = this.appConfigService.getConfig().t2y12PruGU9wUtEGzBJfolMIgK;
    this.logger.log('AppConfigService getAppConfig (WS-REQUESTS-LIST) public_Key', this.public_Key);
    let keys = this.public_Key.split("-");
    this.logger.log('PUBLIC-KEY (WS-REQUESTS-LIST) keys', keys)
    keys.forEach(key => {
      // this.logger.log('NavbarComponent public_Key key', key)

      if (key.includes("PSA")) {
        // this.logger.log('PUBLIC-KEY (WS-REQUESTS-LIST) - key', key);
        let psa = key.split(":");
        // this.logger.log('PUBLIC-KEY (WS-REQUESTS-LIST) - pay key&value', psa);
        if (psa[1] === "F") {
          this.isVisibleSmartAssignOption = false;
        } else {
          this.isVisibleSmartAssignOption = true;
        }
      }

      if (key.includes("OPH")) {
        // this.logger.log('PUBLIC-KEY (SIDEBAR) - key', key);
        let oph = key.split(":");
        // this.logger.log('PUBLIC-KEY (WS-REQUESTS-LIST) - pay key&value', oph);

        if (oph[1] === "F") {
          this.isVisibleOPH = false;
          // this.logger.log('PUBLIC-KEY (WS-REQUESTS-LIST) - isVisibleOPH', this.isVisibleOPH);
        } else {
          this.isVisibleOPH = true;
          // this.logger.log('PUBLIC-KEY (WS-REQUESTS-LIST) - isVisibleOPH', this.isVisibleOPH);
        }
      }

    });


    if (!this.public_Key.includes("PSA")) {
      // this.logger.log('PUBLIC-KEY (PROJECT-EDIT-ADD) - key.includes("PSA")', this.public_Key.includes("PSA"));
      this.isVisibleSmartAssignOption = false;
    }

    if (!this.public_Key.includes("OPH")) {
      // this.logger.log('PUBLIC-KEY (PROJECT-EDIT-ADD) - key.includes("OPH")', this.public_Key.includes("OPH"));
      this.isVisibleOPH = false;
    }



  }

  translateString() {
    this.translate.get('NewRequesterCreatedSuccessfully')
      .subscribe((translation: any) => {
        this.newRequesterCreatedSuccessfullyMsg = translation;
      });


    this.translate.get('UsersWiththeAgentroleCannotManageTheAdvancedOptionsOfTheProject')
      .subscribe((translation: any) => {
        this.agentCannotManageAdvancedOptions = translation;
      });

    this.translate.get('LearnMoreAboutDefaultRoles')
      .subscribe((translation: any) => {
        this.learnMoreAboutDefaultRoles = translation;
      });

    this.translate.get('ThisFeatureIsAvailableWithTheProPlan')
      .subscribe((translation: any) => {
        this.featureIsAvailableWithTheProPlan = translation;
      });
  }


  getStorageBucketFromUserServiceSubscription() {
    this.usersService.imageStorage$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((imagestorage) => {
        this.logger.log('WS-REQUEST-LIST - IMAGE STORAGE from usersService BS sub ', imagestorage);
        if (imagestorage) {
          this.imageStorage$ = imagestorage;
        }
      })
  }

  getImageStorageAndThenProjectUsers() {
    // storage bucket from user service subscription 
    this.imageStorage$ = this.usersService.imageStorage$.value;
    this.logger.log('WS-REQUEST-LIST - IMAGE STORAGE usersService BS value', this.imageStorage$);

    if (this.appConfigService.getConfig().uploadEngine === 'firebase') {
      this.UPLOAD_ENGINE_IS_FIREBASE = true;

      const firebase_conf = this.appConfigService.getConfig().firebase;
      this.storageBucket = firebase_conf['storageBucket'];
      this.logger.log('WS-REQUEST-LIST - IMAGE STORAGE (getImageStorageAndThenProjectUsers)', this.storageBucket, 'usecase firebase');

      this.getAllProjectUsers(this.storageBucket, this.UPLOAD_ENGINE_IS_FIREBASE);

    } else {

      this.UPLOAD_ENGINE_IS_FIREBASE = false;
      this.baseUrl = this.appConfigService.getConfig().SERVER_BASE_URL;

      this.logger.log('WS-REQUEST-LIST - IMAGE STORAGE (getImageStorageAndThenProjectUsers) ', this.baseUrl, 'usecase native')
      this.getAllProjectUsers(this.baseUrl, this.UPLOAD_ENGINE_IS_FIREBASE);
    }

    this.displayProjectUserImageSkeleton()
  }

  displayProjectUserImageSkeleton() {
    setTimeout(() => {
      this.showRealTeammates = true;
    }, 2500);
  }


  getTestSiteUrl() {
    this.TESTSITE_BASE_URL = this.appConfigService.getConfig().testsiteBaseUrl;
    this.logger.log('AppConfigService getAppConfig (WS-REQUESTS-LIST COMP.) TESTSITE_BASE_URL', this.TESTSITE_BASE_URL);
  }

  getChatUrl() {
    this.CHAT_BASE_URL = this.appConfigService.getConfig().CHAT_BASE_URL;
    this.logger.log('AppConfigService getAppConfig (WS-REQUESTS-LIST COMP.) CHAT_BASE_URL', this.CHAT_BASE_URL);
  }

  goToNoRealtimeConversations() {
    this.router.navigate(['project/' + this.projectId + '/all-conversations']);
  }

  showRequestsMap() {
    this.displayRequestsMap = true;
  }

  openRightSideBar() {
    this.OPEN_RIGHT_SIDEBAR = true;
    this.logger.log('%%% Ws-REQUESTS-Map »»»» OPEN RIGHT SIDEBAR ', this.OPEN_RIGHT_SIDEBAR);

    const elemMainContent = <HTMLElement>document.querySelector('.main-content');
    this.logger.log('%%% Ws-REQUESTS-Map - REQUEST-MAP - ON OPEN RIGHT SIDEBAR -> RIGHT SIDEBAR HEIGHT (MAIN-CONTENT)', elemMainContent.clientHeight);
    this.map_sidebar_height = elemMainContent.clientHeight - 100 + 'px';
    this.logger.log('%%% Ws-REQUESTS-Map - REQUEST-MAP - ON OPEN RIGHT SIDEBAR -> RIGHT SIDEBAR HEIGHT', this.map_sidebar_height);

  }

  handleCloseRightSidebar(event) {
    this.logger.log('%%% Ws-REQUESTS-Map »»»» CLOSE RIGHT SIDEBAR ', event);
    this.OPEN_RIGHT_SIDEBAR = false;

    // const _elemMainPanel = <HTMLElement>document.querySelector('.main-panel');
    // _elemMainPanel.setAttribute('style', 'overflow-x: hidden !important;');
  }

  // showRequestsMap() {
  //   this.logger.log('OPEN REQUESTS MAP')
  //   this.router.navigate(['project/' + this.projectId + '/map-request'], {queryParams: {wsRequestsServed: this.wsRequestsServed}});
  // }


  detectBrowserRefresh() {
    // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list CALLING browserRefresh')
    this.browserRefresh = browserRefresh;
    // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list ----- ngOnInit browserRefresh ", this.browserRefresh);
    // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list ----- ngOnInit browserRefresh ", this.browserRefresh, 'wsRequestsList$.value length', this.wsRequestsService.wsRequestsList$.value.length);
    if (this.browserRefresh) {

      this.listenToRequestsLength();
    } else {
      this.wsRequestsService.wsRequestsList$.value
      // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list ----- ngOnInit browserRefresh ", this.browserRefresh, 'wsRequestsList$.value length', this.wsRequestsService.wsRequestsList$.value.length);

    }
  }

  getProjectUserRole() {
    this.usersService.project_user_role_bs
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((user_role) => {
        this.logger.log('WS-REQUESTS-LIST - USER ROLE ', user_role);
        if (user_role) {
          this.CURRENT_USER_ROLE = user_role;
          if (user_role === 'agent') {
            this.ROLE_IS_AGENT = true
            this.displayBtnLabelSeeYourRequets = true
            // ------ 
            this.ONLY_MY_REQUESTS = true
            this.getWsRequests$();
          } else {
            this.ROLE_IS_AGENT = false
            this.displayBtnLabelSeeYourRequets = false;
            this.getWsRequests$();
          }
        }
      });
  }



  // -------------------------------------------------------
  // Used for the old scroll div (now is set to display none)
  // -------------------------------------------------------
  public scrollRight(): void {
    this.teamContent.nativeElement.scrollTo({ left: (this.teamContent.nativeElement.scrollLeft + 150), behavior: 'smooth' });
  }
  public scrollLeft(): void {
    this.teamContent.nativeElement.scrollTo({ left: (this.teamContent.nativeElement.scrollLeft - 150), behavior: 'smooth' });
  }

  public scrollRightTeammates(): void {
    this.widgetsContent.nativeElement.scrollTo({ left: (this.teamContent.nativeElement.scrollLeft + 150), behavior: 'smooth' });
  }

  public scrollLeftTeammates(): void {
    this.widgetsContent.nativeElement.scrollTo({ left: (this.teamContent.nativeElement.scrollLeft - 150), behavior: 'smooth' });
  }

  // async getRequestsTotalCount() {
  //   // this.wsRequestsService.getTotalRequestLength(requestTotal).then((resultImage) => {  })

  //   const totalR = await this.wsRequestsService.getTotalRequestLength();
  //   this.logger.log('% »»» WebSocketJs WF >>>>>>>>> >>>>>>>  L FROM PROMISE ',totalR);
  // }

  for1() {
    // this.Xlength = this.wsRequestsService.wsRequestsListLength$.value
    this.wsRequestsService.ws_All_RequestsLength$.subscribe((totalrequests: number) => {

      this.Xlength = totalrequests
    })

    this.logger.log('% »»» WebSocketJs WF >>>>>>>>> >>>>>>> FOR 1 Lenght ', this.Xlength);
    // this.logger.log('% »»» WebSocketJs WF >>>>>>>>> >>>>>>> FOR 1 ', this.i);

    if (this.Xlength !== undefined) {

      this.for2();

    } else if (this.Xlength === undefined) {
      setTimeout(() => {
        // this.showSpinner = false;

      }, 100);
    }
  }

  for2() {
    // var length = 10;
    if (this.i == this.Xlength) {
      this.logger.log('% »»» WebSocketJs WF >>>>>>>>> >>>>>>> FOR 1 == Xlength ');
      // this.showSpinner = false;
      return false;
    }
    setTimeout(() => {
      this.i++;
      this.for1();
    }, 50);
  }


  getAllProjectUsers(imagestorage: string, isfirebaseuploadengine: boolean) {
    // createBotsAndUsersArray() {
    this.usersService.getProjectUsersByProjectId().subscribe((_projectUsers: any) => {
      // this.logger.log('% »»» WebSocketJs WF WS-RL - +++ GET PROJECT-USERS ', projectUsers);
      this.logger.log('WS-REQUESTS-LIST - GET PROJECT-USERS RES ', _projectUsers);
      if (_projectUsers) {
        this.project_users = _projectUsers
        this.project_user_length = _projectUsers.length;
        this.logger.log('WS-REQUESTS-LIST - GET PROJECT-USERS LENGTH ', this.project_user_length);
        // this.projectUserArray = _projectUsers;

        _projectUsers.forEach(projectuser => {

          this.logger.log('WS-REQUESTS-LIST - GET PROJECT-USERS forEach projectuser ', projectuser);
          let imgUrl = ''
          if (isfirebaseuploadengine === true) {
            imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + imagestorage + "/o/profiles%2F" + projectuser.id_user._id + "%2Fphoto.jpg?alt=media";
          } else {

            imgUrl = imagestorage + "images?path=uploads%2Fusers%2F" + projectuser.id_user._id + "%2Fimages%2Fthumbnails_200_200-photo.jpg"
          }

          this.checkImageExists(imgUrl, (existsImage) => {
            if (existsImage == true) {
              projectuser.hasImage = true
            }
            else {
              projectuser.hasImage = false
            }
          });

          this.wsRequestsService.subscriptionToWsAllProjectUsersOfTheProject(projectuser.id_user._id);

          this.listenToAllProjectUsersOfProject$(projectuser)

          this.createAgentAvatarInitialsAnfBckgrnd(projectuser.id_user)
          //   if (user) {
          //     this.user_and_bot_array.push({ '_id': user.id_user._id, 'firstname': user.id_user.firstname, 'lastname': user.id_user.lastname });
          //     this.team_ids_array.push(user.id_user._id);
          //   }
        });

        // this.logger.log('% »»» WebSocketJs WF WS-RL - +++ USERS & BOTS ARRAY (1) ', this.user_and_bot_array);
      }
    }, (error) => {
      this.logger.error('WS-REQUESTS-LIST - GET PROJECT-USERS - ERROR ', error);
    }, () => {
      this.logger.log('WS-REQUESTS-LIST - GET PROJECT-USERS * COMPLETE *');
      // this.getAllBot();
    });
  }

  createAgentAvatarInitialsAnfBckgrnd(agent) {

    let fullname = '';
    if (agent && agent.firstname && agent.lastname) {


      fullname = agent.firstname + ' ' + agent.lastname
      agent['fullname_initial'] = avatarPlaceholder(fullname);
      agent['fillColour'] = getColorBck(fullname)
    } else if (agent && agent.firstname) {

      fullname = agent.firstname
      agent['fullname_initial'] = avatarPlaceholder(fullname);
      agent['fillColour'] = getColorBck(fullname)
    } else {
      agent['fullname_initial'] = 'N/A';
      agent['fillColour'] = 'rgb(98, 100, 167)';
    }

  }

  listenToAllProjectUsersOfProject$(projectuser) {
    this.wsRequestsService.projectUsersOfProject$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((projectUser_from_ws_subscription) => {
        // this.logger.log('WS-REQUESTS-LIST $UBSC TO WS PROJECT-USERS (listenTo)', projectUser_from_ws_subscription);
        // this.logger.log('WS-REQUESTS-LIST PROJECT-USERS ', projectuser);

        if (projectuser['_id'] === projectUser_from_ws_subscription['_id']) {
          // projectUser_from_ws_subscription['email'] = projectuser['id_user']['email']
          // projectUser_from_ws_subscription['firstname'] = projectuser['id_user']['firstname']
          // projectUser_from_ws_subscription['lastname'] = projectuser['id_user']['lastname']

          projectuser['number_assigned_requests_rt'] = projectUser_from_ws_subscription['number_assigned_requests'];
          projectuser['user_available_rt'] = projectUser_from_ws_subscription['user_available'];
          projectuser['isBusy_rt'] = projectUser_from_ws_subscription['isBusy'];
          projectuser['updatedAt_rt'] = projectUser_from_ws_subscription['updatedAt'];

        }

        // const index = this.projectUserArray((e) => e._id === projectuser._id);
        this.tempProjectUserArray.indexOf(projectuser) === -1 ? this.tempProjectUserArray.push(projectuser) : this.logger.log("This item already exists");
        // this.projectUserArray.push(projectuser)

        // this.logger.log('WS-REQUESTS-LIST - GET PROJECT-USERS TEMP projectUserArray ', this.tempProjectUserArray);
        this.tempProjectUserArray.sort(function (a, b) { return a.user_available_rt - b.user_available_rt });
        this.tempProjectUserArray.reverse();
        this.projectUserArray = this.tempProjectUserArray;

        // this.tempProjectUserArray.forEach((element, index) => {
        //     // this.logger.log('WS-REQUESTS-LIST - GET PROJECT-USERS TEMP projectUserArray loop index ', index);

        // this.projectUserArray = this.tempProjectUserArray;

        //     // if ((index + 1) === this.project_user_length) {

        //     //   this.display_teammates_in_scroll_div = true;

        //     //   this.logger.log('WS-REQUESTS-LIST - GET PROJECT-USERS TEMP qui entro ');
        //     // }
        // });

        // this.projectUserArray.sort((n1, n2) => {
        //   if (n1.user_available_rt === true) {
        //     return 1;
        //   }

        //   if (n2.user_available_rt === false) {
        //     return -1;
        //   }

        //   return 0;
        // });

        // this.projects.forEach(project => {
        //   if (project.id_project._id === projectUser['id_project']) {
        //     project['ws_projct_user_available'] = projectUser['user_available'];
        //     project['ws_projct_user_isBusy'] = projectUser['isBusy']
        //   }
        // });

      }, (error) => {
        this.logger.error('PROJECT COMP $UBSC TO WS USER AVAILABILITY & BUSY STATUS error ', error);
      }, () => {
        this.logger.log('PROJECT COMP $UBSC TO WS USER AVAILABILITY & BUSY STATUS * COMPLETE *');
      })

  }

  getAllBot() {
    this.faqKbService.getFaqKbByProjectId().subscribe((bots: any) => {
      this.logger.log('% »»» WebSocketJs WF - +++ GET  BOT ', bots);

      if (bots) {
        bots.forEach(bot => {
          if (bot) {
            this.user_and_bot_array.push({ '_id': 'bot_' + bot._id, 'firstname': bot.name + ' (bot)' });
            this.team_ids_array.push('bot_' + bot._id);
          }
        });
      }
      // this.logger.log('% »»» WebSocketJs WF WS-RL - +++ TEAM IDs ARRAY (2) ', this.team_ids_array);
      this.logger.log('% »»» WebSocketJs WF WS-RL - +++ TEAM ARRAY (2) ', this.user_and_bot_array);
      // this.doFlatParticipantsArray()

    }, (error) => {
      this.logger.error('% »»» WebSocketJs WF WS-RL - +++ GET  BOT ', error);
    }, () => {
      this.logger.log('% »»» WebSocketJs WF WS-RL - +++ GET  BOT * COMPLETE *');
    });
  }

  doFlatParticipantsArray() {
    this.subscription = this.wsRequestsService.wsRequestsList$.subscribe((wsrequests) => {
      if (wsrequests) {
        let flat_participants_array = [];

        for (let i = 0; i < wsrequests.length; i++) {
          flat_participants_array = flat_participants_array.concat(wsrequests[i].participants);
        }

        // this.logger.log('% »»» WebSocketJs WF WS-RL - +++ FLAT PARTICIPANTS IDs ARRAY ', flat_participants_array);
        if (flat_participants_array) {
          for (let i = 0; i < this.team_ids_array.length; i++) {
            // this.logger.log('% »»» WebSocketJs WF WS-RL -  TEAM IDs ARRAY LENGTH ', this.team_ids_array.length);
            this.getAgentIdOccurrencesinFlatParticipantsArray(flat_participants_array, this.team_ids_array[i])
          }
        }
      }
    })
  }

  getAgentIdOccurrencesinFlatParticipantsArray(array, value) {
    // this.logger.log('% »»» WebSocketJs WF WS-RL - CALLING GET OCCURRENCE REQUESTS FOR AGENT AND ASSIGN TO PROJECT USERS');
    let count = 0;
    array.forEach((v) => (v === value && count++));
    // this.logger.log('% »»» WebSocketJs WF WS-RL - #', count, ' REQUESTS ASSIGNED TO AGENT WITH ID ', value);

    for (const agent of this.user_and_bot_array) {
      if (value === agent._id) {
        agent.value = count
      }
    }
    return count;
  }


  listenToRequestsLength() {
    this.subscription = this.wsRequestsService.ws_All_RequestsLength$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((totalrequests: number) => {
        this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list listenToRequestsLength RECEIVED NEXT wsRequestsList LENGTH', totalrequests)

        if (totalrequests === 0) {
          this.SHOW_SIMULATE_REQUEST_BTN = true
          this.showSpinner = false;
          this.logger.log('% »»» WebSocketJs WF +++++ ws-requests---  listenToRequestsLength SHOW_SIMULATE_REQUEST_BTN ', this.SHOW_SIMULATE_REQUEST_BTN)
          this.logger.log('% »»» WebSocketJs WF +++++ ws-requests---  listenToRequestsLength showSpinner ', this.showSpinner)

        } else if (totalrequests > 0) {

          this.showSpinner = false;
          this.SHOW_SIMULATE_REQUEST_BTN = false
          this.logger.log('% »»» WebSocketJs WF +++++ ws-requests---  listenToRequestsLength SHOW_SIMULATE_REQUEST_BTN ', this.SHOW_SIMULATE_REQUEST_BTN)
          this.logger.log('% »»» WebSocketJs WF +++++ ws-requests---  listenToRequestsLength showSpinner ', this.showSpinner)

        }

        // this.logger.log('% »»» WebSocketJs WF - WsRequestsList >>>>>>> >>>>>>> BEHAVIOUR TOTAL-REQUESTS <<<<<<< ', totalrequests)
        // this.logger.log('% »»» WebSocketJs WF - WsRequestsList >>>>>>> >>>>>>> THIS.WS-REQUESTS LENGTH <<<<<<< ', this.ws_requests.length)
        // if (totalrequests) {
        //   this.totalRequests = totalrequests
        // }
      })
  }

  public generateFake(count: number): Array<number> {
    const indexes = [];
    for (let i = 0; i < count; i++) {
      indexes.push(i);
    }
    return indexes;
  }

  getLoggedUser() {
    this.auth.user_bs.subscribe((user) => {
      this.logger.log('%%% WsRequestsList  USER ', user)
      // this.user = user;
      if (user) {
        this.currentUserID = user._id
        this.logger.log('% »»» currentUserID WsRequestsList currentUser ID', this.currentUserID);
      }
    });
  }


  // -----------------------------------------------------------------------------------------------------
  // @ Subscribe to get the published current project (called On init)
  // -----------------------------------------------------------------------------------------------------
  getCurrentProjectAndThenDetProjectById() {
    this.auth.project_bs.subscribe((project) => {
      this.logger.log('WsRequestsList  project', project)
      if (project) {
        this.projectId = project._id;
        this.projectName = project.name;
        this.OPERATING_HOURS_ACTIVE = project.operatingHours

        this.getProjectById(this.projectId)
      }
    });
  }

  // CHAT_REASSIGNMENT_IS_ENABLED: boolean // reassignment_on
  // reassignment_timeout: number; // reassignment_delay
  // CHAT_LIMIT_IS_ENABLED: boolean // key chat_limit_on
  // maximum_chats: number; // key max_agent_assigned_chat
  // AUTOMATIC_UNAVAILABLE_STAUS_IS_ENABLED: boolean; // automatic_unavailable_status_on
  // chats_reassigned: number // key automatic_idle_chats

  getProjectById(projectid) {
    this.projectService.getProjectById(projectid).subscribe((project: any) => {
      this.logger.log('WS-REQUESTS-LIST - GET PROJECT BY ID - RES: ', project);

      // if (project && project.profile) {
      //   this.prjct_profile_name = project.profile.name
      //   this.subscription_end_date = project.profile.subEnd
      //   if (project.profile.type === 'free' && project.trialExpired === true) {
      //     this.DISPLAY_MODAL_UPGRADE_PLAN = true;
      //     this.DISPLAY_MODAL_SUBSCRIPTION_PROBLEM = false;
      //   } else if (project.profile.type === 'payment' && project.isActiveSubscription === false) {
      //     this.DISPLAY_MODAL_UPGRADE_PLAN = true;
      //     this.DISPLAY_MODAL_SUBSCRIPTION_PROBLEM = true;
      //   } else if (project.profile.type === 'free' && project.trialExpired === false || project.profile.type === 'payment' && project.isActiveSubscription === true) {
      //     this.DISPLAY_MODAL_UPGRADE_PLAN = false;
      //     this.DISPLAY_MODAL_SUBSCRIPTION_PROBLEM = false;
      //   }
      // }

      if (project && project.activeOperatingHours === true) {
        let operatingHoursObj = JSON.parse(project.operatingHours)
        const operatingHoursSizeObj = Object.keys(operatingHoursObj).length;
        this.logger.log('WS-REQUESTS-LIST - GET PROJECT BY ID operatingHoursSizeObj: ', operatingHoursSizeObj);
      }


      if (project && project.settings) {
        if (project.settings.reassignment_on === true) {
          this.CHAT_REASSIGNMENT_IS_ENABLED = true;
          this.reassignment_timeout = project.settings.reassignment_delay
        } else {
          this.CHAT_REASSIGNMENT_IS_ENABLED = false
        }

        if (project.settings.chat_limit_on === true) {
          this.CHAT_LIMIT_IS_ENABLED = true;
          this.maximum_chats = project.settings.max_agent_assigned_chat
        } else {
          this.CHAT_LIMIT_IS_ENABLED = false
        }

        if (project.settings.automatic_unavailable_status_on === true) {
          this.AUTOMATIC_UNAVAILABLE_STAUS_IS_ENABLED = true;
          this.chats_reassigned = project.settings.automatic_idle_chats
        } else {
          this.AUTOMATIC_UNAVAILABLE_STAUS_IS_ENABLED = false
        }

      } else {
        this.CHAT_REASSIGNMENT_IS_ENABLED = false;
        this.CHAT_LIMIT_IS_ENABLED = false;
        this.AUTOMATIC_UNAVAILABLE_STAUS_IS_ENABLED = false;
      }

    }, error => {
      // this.showSpinner = false;
      this.logger.error('WS-REQUESTS-LIST - GET PROJECT BY ID - ERROR', error);
    }, () => {
      this.logger.log('WS-REQUESTS-LIST - GET PROJECT BY ID - * COMPLETE *');

    });
  }

  goToOperatingHours() {
    if (this.CURRENT_USER_ROLE !== 'agent') {
      this.router.navigate(['project/' + this.projectId + '/hours']);
    } else {
      this.presentModalAgentCannotManageAvancedSettings();
    }
  }


  goToProjectSettings_Advanced() {
    this.logger.log('WS-REQUESTS-LIST HAS CLICKED goToProjectSettings_Advanced');

    if (this.CURRENT_USER_ROLE !== 'agent') {
      this.router.navigate(['project/' + this.projectId + '/project-settings/advanced']);

    } else if (this.CURRENT_USER_ROLE === 'agent') {
      this.presentModalAgentCannotManageAvancedSettings();
    }

    // if (this.CURRENT_USER_ROLE !== 'agent') {
    //   this.logger.log('WS-REQUESTS-LIST CURRENT_USER_ROLE 1 ', this.CURRENT_USER_ROLE, 'DISPLAY_MODAL_UPGRADE_PLAN 1', this.DISPLAY_MODAL_UPGRADE_PLAN)
    //   if (this.DISPLAY_MODAL_UPGRADE_PLAN === false && this.DISPLAY_MODAL_SUBSCRIPTION_PROBLEM === false) {
    //     this.logger.log('WS-REQUESTS-LIST CURRENT_USER_ROLE ', this.CURRENT_USER_ROLE, 'DISPLAY_MODAL_UPGRADE_PLAN ', this.DISPLAY_MODAL_UPGRADE_PLAN)
    //     this.router.navigate(['project/' + this.projectId + '/project-settings/advanced']);
    //   } else if (this.DISPLAY_MODAL_UPGRADE_PLAN === true) {
    //     if (this.CURRENT_USER_ROLE === 'admin') {
    //       this.presentModalFeatureAvailableWithProPlanUserRoleAdmin();
    //     }
    //     if (this.CURRENT_USER_ROLE === 'owner') {
    //       if (this.DISPLAY_MODAL_SUBSCRIPTION_PROBLEM === true) {
    //         this.notify.displaySubscripionHasExpiredModal(true, this.prjct_profile_name, this.subscription_end_date);
    //       }
    //       if (this.DISPLAY_MODAL_SUBSCRIPTION_PROBLEM === false) {
    //         this.presentModalFeatureAvailableWithProPlanUserRoleOwner();
    //       }
    //     }
    //     // this.presentModalOnlyOwnerCanManageTheAccountPlan()
    //   }
    // } else if (this.CURRENT_USER_ROLE === 'agent') {
    //   this.presentModalAgentCannotManageAvancedSettings();
    // }
  }

  presentModalAgentCannotManageAvancedSettings() {
    const el = document.createElement('div')
    el.innerHTML = this.agentCannotManageAdvancedOptions + '. ' + "<a href='https://docs.tiledesk.com/knowledge-base/understanding-default-roles/' target='_blank'>" + this.learnMoreAboutDefaultRoles + "</a>"

    swal({

      content: el,
      icon: "info",
      button: {
        text: "OK",
      },
      dangerMode: false,
    })
  }

  // NOT USED 
  presentModalFeatureAvailableWithProPlanUserRoleAdmin() {
    swal({
      text: this.featureIsAvailableWithTheProPlan,
      icon: "info",
      button: {
        text: "OK",
      },
      dangerMode: false,
    })
  }

  // NOT USED 
  presentModalFeatureAvailableWithProPlanUserRoleOwner() {
    swal({
      text: this.featureIsAvailableWithTheProPlan,
      icon: "info",
      buttons: ["Cancel", "Upgrade Plan"],
      dangerMode: false,
    })
      .then((upgradePlan) => {
        if (upgradePlan) {
          this.logger.log('WS-REQUESTS-LIST swal upgradePlan', upgradePlan)
          this.router.navigate(['project/' + this.projectId + '/pricing']);
        } else {
          this.logger.log('WS-REQUESTS-LIST swal upgradePlan (else)', upgradePlan)
        }
      });
  }

  seeIamAgentRequests(seeIamAgentReq) {
    this.ONLY_MY_REQUESTS = seeIamAgentReq
    this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list + ONLY_MY_REQUESTS ', this.ONLY_MY_REQUESTS);
    if (seeIamAgentReq === false) {
      this.displayBtnLabelSeeYourRequets = false;
    } else {
      this.displayBtnLabelSeeYourRequets = true;
    }
    this.getWsRequests$()
  }

  goToDept(deptid) {
    this.router.navigate(['project/' + this.projectId + '/department/edit/' + deptid]);
    // this.display_dept_sidebar = true;
    // this.ws_requestslist_deptIdSelected = deptid
  }

  parseUserAgent(uastring) {
    // https://github.com/faisalman/ua-parser-js
    var parser = new UAParser();
    // var uastring = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36";
    parser.setUA(uastring);
    return parser.getResult();
  }

  // getRequestsTotalCount(wsrequests): Observable<[]> {
  //   return Observable.of(wsrequests);
  // }


  // countRequestsLength(wsrequests) {
  //   this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList  ≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥ CALLING NOW countRequestsLength ',wsrequests.length);
  //   if (wsrequests.length === 0) {
  //     this.showSpinner = false;
  //     this.SHOW_SIMULATE_REQUEST_BTN = true;
  //   }
  // }
  asyncFunction(item, cb) {
    setTimeout(() => {
      // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list  ≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥≥ asyncFunction done with', item);
      cb();
    }, 100);
  }

  hasmeInAgents(agents, wsrequest) {
    // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list + hasmeInAgents agents", agents);

    if (agents) {
      for (let j = 0; j < agents.length; j++) {
        // this.logger.log("% »»» WebSocketJs WF - WsRequestsList »»» »»» hasmeInAgents agent", agents[j]);
        this.logger.log("WS-REQUESTS-LIST hasmeInAgents currentUserID 2 ", this.currentUserID);
        // this.logger.log("% »»» WebSocketJs WF - WsRequestsList id_user ", agents[j].id_user);

        if (this.currentUserID === agents[j].id_user) {
          return true
          // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list + hasmeInAgents in If", iAmThere, '(forEach) the request id ', wsrequest.request_id, ' status: ', wsrequest.status, ' agent: ', agents );
        }
        // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list + hasmeInAgents", iAmThere, '(forEach) the request id ', wsrequest.request_id, ' status: ', wsrequest.status, ' agent: ', agents );
        // return iAmThere
      }
    } else {
      this.logger.log("WS-REQUESTS-LIST hasmeInAgents Oops!!!! AGENT THERE ARE NOT  ");
    }
  }

  // this check fix the bug: the request is assigned to a agent or admin od the dept A 
  // the the same requets is reassigned to an agent or admin of the dept B
  // the agent or admin doesn't see the request
  hasmeInParticipants(participants) {
    let iAmThere = false
    participants.forEach(participant => {
      this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list + hasmeInParticipants  participant', participant)
      if (participant === this.currentUserID) {
        // this.logger.log('»»»»»»» UTILS MEMBERS ', members)
        // this.logger.log('»»»»»»» CURRENT_USER_JOINED ', currentUserFireBaseUID);
        iAmThere = true;
        return
      }
    });
    this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list + hasmeInParticipants', iAmThere);
    return iAmThere;

  }

  // DEPTS_LAZY: add this 
  addDeptObject(wsrequests) {
    this.departmentService.getDeptsByProjectIdToPromise().then((_departments: any) => {
      // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- service -  X-> DEPTS <-X', _departments)

      wsrequests.forEach(request => {
        if (request.department) {
          const deptHasName = request.department.hasOwnProperty('name')
          if (deptHasName) {
            // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- service -  X-> REQ DEPT HAS NAME', deptHasName)
            request['dept'] = request.department
          } else {
            // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- service -  X-> REQ DEPT HAS NAME', deptHasName)
            // if (request.department.hasOwnProperty('_id'))
            // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- service -  X-> REQ DEPT HAS ID', request.department.hasOwnProperty('_id'))

            if (request.department.hasOwnProperty('_id')) {
              // in this case department is an object (i.e.  department: {_id: "5df26badde7e1c001743b63e"} )
              request['dept'] = this.getDeptObj(request.department._id, _departments)

            } else {
              // in this case department is a string equivalent to the department id (i.e. department: "5df26badde7e1c001743b63e" )
              request['dept'] = this.getDeptObj(request['department'], _departments)
            }
          }
        }

      });

      this.getDeptsAndCountOfDeptsInRequests(wsrequests);
    });
  }
  // DEPTS_LAZY: add this 
  getDeptObj(departmentid: string, deparments: any) {
    this.logger.log('% »»» WebSocketJs WF +++++ ws-requests - getDeptObj departmentid', departmentid)
    // const deptObjct =  this.departments.findIndex((e) => e.department === departmentid);
    const deptObjct = deparments.filter((obj: any) => {
      return obj._id === departmentid;
    });
    // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- service -  X-> DEPT OBJECT <-X', deptObjct)
    return deptObjct[0]
  }


  onChangeDepts() {
    this.hasFiltered = true
    // this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Depts - dept id', this.selectedDeptId);

    this.filter[0]['deptId'] = this.selectedDeptId

    this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Depts - filter', this.filter)
    this.getWsRequests$();
    // this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Depts - ws Requests Unserved ', this.wsRequestsUnserved.length);
    // this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Depts - ws Requests Served length', this.wsRequestsServed.length)

  }

  clearDeptFilter() {
    this.filter[0]['deptId'] = null;
    this.hasFiltered = false
    // this.getWsRequests$();
    this.logger.log('% »»» WebSocketJs WF WS-RL - clear Dept Filter selectedDeptId', this.selectedDeptId)
  }

  onChangeAgent() {
    this.hasFiltered = true
    // this.filter['agentId'] = this.selectedAgentId
    // this.filter.push({ 'agentId': this.selectedAgentId }) 
    this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Agent filter', this.filter)
    this.filter[1]['agentId'] = this.selectedAgentId;
    this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Agent - selected Agent Id', this.selectedAgentId);


    if (this.selectedAgentId === 1) {
      this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Agent >> HUMAN Agents Id Array', this.humanAgentsIdArray)
    }

    if (this.selectedAgentId === 2) {
      this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Agent >> BOT Agents Id Array', this.botAgentsIdArray)
    }

    // this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Agent - filter', this.filter)
    this.getWsRequests$();

    // this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Agent - ws Requests Unserved ', this.wsRequestsUnserved.length);
    // this.logger.log('% »»» WebSocketJs WF WS-RL - on Change Agent - ws Requests Served ', this.wsRequestsServed.length)
  }

  clearAgentFilter() {
    // this.logger.log('% »»» WebSocketJs WF WS-RL - clear Agent Filter selectedAgentId', this.selectedAgentId)
    this.filter[1]['agentId'] = null;
    this.hasFiltered = false
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Subscribe to get the published requests (called On init)
  // -----------------------------------------------------------------------------------------------------
  getWsRequests$() {
    this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list - enter NOW in getWsRequests$");
    this.wsRequestsService.wsRequestsList$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe((wsrequests) => {

        // DEPTS_LAZY: add this 
        // this.addDeptObject(wsrequests)

        // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list - subscribe ", wsrequests);

        if (wsrequests) {
          this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list - subscribe > if (wsrequests) ", wsrequests);
          this.browserRefresh = browserRefresh;

          // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list subscribe > if (wsrequests) browserRefresh ", this.browserRefresh, 'wsRequestsList$.value length ', this.wsRequestsService.wsRequestsList$.value.length);


          if ((this.browserRefresh === false) || (this.browserRefresh === true && this.wsRequestsService.wsRequestsList$.value.length > 0)) {
            if (wsrequests.length > 0) {

              this.SHOW_SIMULATE_REQUEST_BTN = false;
              this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list ----- SHOW_SIMULATE_REQUEST_BTN ', this.SHOW_SIMULATE_REQUEST_BTN)
              this.showSpinner = false;
              this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list ----- SHOW_SPINNER ', this.showSpinner)


            } else if (wsrequests.length === 0) {
              this.SHOW_SIMULATE_REQUEST_BTN = true;
              this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list ----- SHOW_SIMULATE_REQUEST_BTN ', this.SHOW_SIMULATE_REQUEST_BTN)
              this.showSpinner = false;
              this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list ----- SHOW_SPINNER ', this.showSpinner)
            }
          }



          if (this.ONLY_MY_REQUESTS === false) {
            this.ws_requests = wsrequests;
            // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list - ONLY_MY_REQUESTS: ', this.ONLY_MY_REQUESTS, ' - this.ws_requests: ', this.ws_requests)
            this.addDeptObject(this.ws_requests)
          }

          if (this.ONLY_MY_REQUESTS === true) {
            this.ws_requests = [];
            wsrequests.forEach(wsrequest => {
              // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list - ONLY_MY_REQUESTS: ', this.ONLY_MY_REQUESTS, ' - (forEach) wsrequest: ', wsrequest);
              // const imInParticipants = this.hasmeInParticipants(wsrequest.participants)
              // this.logger.log("% »»» WebSocketJs - WsRequestsService imInParticipants ", imInParticipants, 'for the request ', wsrequest.participants);

              if (wsrequest !== null && wsrequest !== undefined) {
                // || wsrequest.status === 100
                // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list - »»» »»» hasmeInAgents ONLY_MY_REQUESTS forEach hasmeInAgents", this.hasmeInAgents(wsrequest.agents, wsrequest));
                // this.logger.log("% »»» WebSocketJs WF +++++ ws-requests--- list - »»» »»» hasmeInAgents ONLY_MY_REQUESTS forEach hasmeInAgents (get from snapshot)", this.hasmeInAgents(wsrequest.snapshot.agents, wsrequest));
                if (this.hasmeInAgents(wsrequest.agents, wsrequest) === true || this.hasmeInParticipants(wsrequest.participants) === true) {
                  // if (this.hasmeInAgents(wsrequest.snapshot.agents, wsrequest) === true || this.hasmeInParticipants(wsrequest.participants) === true) {

                  this.ws_requests.push(wsrequest);
                }
              }
            });
            this.addDeptObject(this.ws_requests)
            // this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list - ONLY_MY_REQUESTS  ', this.ONLY_MY_REQUESTS, 'this.ws_requests', this.ws_requests)
          }

          // DEPTS_LAZY: comment this 2 lines
          // var ws_requests_clone = JSON.parse(JSON.stringify(this.ws_requests));
          // this.getDeptsAndCountOfDeptsInRequests(ws_requests_clone);


          this.getParticipantsInRequests(this.ws_requests);

          if (this.hasFiltered === true) {
            this.ws_requests = this.ws_requests.filter(r => {
              // this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList filter r department : ', r.department._id);
              // this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList filter selectedDeptId : ', this.selectedDeptId);

              this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList filter: ', this.filter);
              // this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList filter[0]: ', this.filter[0]);
              // this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList filter[1]: ', this.filter[1]);

              // -----------------------------------------------------------------------------------------------------------
              // USECASE: filter only for department
              // -----------------------------------------------------------------------------------------------------------
              if (this.filter[0] !== undefined && this.filter[0]['deptId'] !== null && this.filter[1]['agentId'] === null) {
                this.logger.log('% »»» WebSocketJs WF WS-RL - <<<<<<<<<<<<<< FILTER USECASE 1  >>>>>>>>>>>>>>  filter only for department ');
                this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList >>> filter[deptId] <<< ', this.filter[0]['deptId']);

                this.logger.log('% »»» WebSocketJs WF WS-RL - <<<<<<<<<<<<<< FILTER USECASE 1  >>>>>>>>>>>>>>  r[dept] ', r['dept']);
                // if (r['department']['_id'] === this.filter[0]['deptId']) {
                if (r['dept']['_id'] === this.filter[0]['deptId']) {
                  return true
                } else {
                  return false
                }
              }

              // -----------------------------------------------------------------------------------------------------------
              // USECASE: filter only for participant
              // -----------------------------------------------------------------------------------------------------------
              if (this.filter[1] !== undefined && this.filter[1]['agentId'] !== null && this.filter[0]['deptId'] === null) {
                this.logger.log('% »»» WebSocketJs WF WS-RL - <<<<<<<<<<<<<< FILTER USECASE 2  >>>>>>>>>>>>>> filter only for participant');
                this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList >>> filter[agentId] <<< ', this.filter[1]['agentId']);
                // this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList >>> filter[agentId] IS ARRAY <<< ', Array.isArray(this.filter[1]['agentId']));

                // -----------------------------------------------------------------------------------------------------------
                // USECASE: filter only for participant --- only all human 
                // -----------------------------------------------------------------------------------------------------------

                if (this.filter[1]['agentId'] === 1) {

                  // note  some is equivalent to r['participants'].includes('5dd278b8989ecd00174f9d6b') || r['participants'].includes('5e05f5c07be85e0017e4fc92') || r['participants'].includes('5ddd30bff0195f0017f72c6d')
                  if (this.humanAgentsIdArray.some(participantid => r['participants'].includes(participantid))) {
                    return true

                  } else {
                    return false
                  }


                  // -----------------------------------------------------------------------------------------------------------
                  // USECASE: filter only for participant --- only all bot 
                  // -----------------------------------------------------------------------------------------------------------
                } else if (this.filter[1]['agentId'] === 2) {
                  this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList >>> FILTER AGENT ID 2 <<< r[participants] ', r['participants']);
                  if (this.botAgentsIdArray.some(participantid => r['participants'].includes(participantid))) {

                    return true

                  } else {
                    return false
                  }

                  // -----------------------------------------------------------------------------------------------------------
                  // USECASE: filter only for participant --- only one participant (human or bot)
                  // -----------------------------------------------------------------------------------------------------------
                } else if (r['participants'].includes(this.filter[1]['agentId'])) {
                  return true
                } else {
                  return false
                }

              }



              // -----------------------------------------------------------------------------------------------------------
              // USECASE: filter for department & participant
              // -----------------------------------------------------------------------------------------------------------
              if (this.filter[1] !== undefined && this.filter[1]['agentId'] !== null && this.filter[0] !== undefined && this.filter[0]['deptId'] !== null) {
                this.logger.log('% »»» WebSocketJs WF WS-RL - <<<<<<<<<<<<<< FILTER USECASE 3 >>>>>>>>>>>>>> filter for dept & participant');
                this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList >>> filter[agentId] <<< ', this.filter[1]['agentId']);
                // if (r['participants'].includes(this.filter[1]['agentId']) && (r['department']['_id'] === this.filter[0]['deptId'])) {

                if (this.filter[1]['agentId'] === 1) {
                  if (this.humanAgentsIdArray.some(participantid => r['participants'].includes(participantid)) && (r['dept']['_id'] === this.filter[0]['deptId'])) {
                    return true
                  } else {
                    return false
                  }

                } else if (this.filter[1]['agentId'] === 2) {
                  if (this.botAgentsIdArray.some(participantid => r['participants'].includes(participantid)) && (r['dept']['_id'] === this.filter[0]['deptId'])) {
                    return true
                  } else {
                    return false
                  }


                } else if (r['participants'].includes(this.filter[1]['agentId']) && (r['dept']['_id'] === this.filter[0]['deptId'])) {
                  return true
                } else {
                  return false
                }

              }

              // -----------------------------------------------------------------------------------------------------------
              // USECASE: all filters have been canceled
              // -----------------------------------------------------------------------------------------------------------
              if (this.filter[1]['agentId'] === null && this.filter[0]['deptId'] === null) {
                this.logger.log('% »»» WebSocketJs WF WS-RL - <<<<<<<<<<<<<< FILTER USECASE 4 >>>>>>>>>>>>>> all filters have been canceled');
                this.hasFiltered = false
                return true
              }

              // else {
              //   return false
              // }


              this.logger.log('% »»» WebSocketJs WF WS-RL - WsRequestsList filter[deptId]: ', this.filter[0]['deptId']);

            });
          }
        }

        // this.logger.log('% »»» WebSocketJs WF - WsRequestsList getWsRequests$ ws_request ', wsrequests)


        // this.ws_requests.forEach(request => {
        this.ws_requests.forEach((request) => {

          this.logger.log('% »»» WebSocketJs WF - WsRequestsList request ', request)

          const user_agent_result = this.parseUserAgent(request.userAgent)
          // this.logger.log('% »»» WebSocketJs WF - WsRequestsList - USER-AGENT RESULT ', user_agent_result)      

          const ua_browser = user_agent_result.browser.name + ' ' + user_agent_result.browser.version
          // this.logger.log('% »»» WebSocketJs WF - WsRequestsList - USER-AGENT BROWSER ', ua_browser)
          request['ua_browser'] = ua_browser;

          const ua_os = user_agent_result.os.name + ' ' + user_agent_result.os.version
          // this.logger.log('% »»» WebSocketJs WF - WsRequestsList - USER-AGENT OPERATING SYSTEM ', ua_os)
          request['ua_os'] = ua_os;

          // ------------------------------------------------------------------------------------------
          // for the tooltip on the icon of unserved conversations showing last users who have left the chat
          // ------------------------------------------------------------------------------------------
          if (request.attributes && request.attributes.last_abandoned_by_project_user) {

            this.logger.log('WS-REQUESTS-LIST - for the tooltip - request.attributes', request.attributes)
            this.logger.log('WS-REQUESTS-LIST - for the tooltip - project_users', this.project_users)

            const project_user_id = request.attributes.last_abandoned_by_project_user;
            this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED project_user_id', project_user_id)

            const users_found_in_storage_by_projectuserid = this.usersLocalDbService.getMemberFromStorage(project_user_id);
            this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED project_users_found_in_storage', users_found_in_storage_by_projectuserid)

            // const userid = users_found_in_storage_by_projectuserid['_id']
            // this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED project_users_found_in_storage userid', userid)


            if (users_found_in_storage_by_projectuserid !== null) {
              this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED project_users_found_in_storage 1', users_found_in_storage_by_projectuserid)
              this.createArrayLast_abandoned_by_project_user(users_found_in_storage_by_projectuserid, request)
            } else {


              this.usersService.getProjectUserByProjecUserId(project_user_id)
                .subscribe((projectuser) => {
                  this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED getProjectUserById RES', projectuser)

                  let imgUrl = ''
                  if (this.UPLOAD_ENGINE_IS_FIREBASE === true) {
                    imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + this.storageBucket + "/o/profiles%2F" + projectuser['id_user']._id + "%2Fphoto.jpg?alt=media"
                  } else {
                    imgUrl = this.baseUrl + "images?path=uploads%2Fusers%2F" + projectuser['id_user']._id + "%2Fimages%2Fthumbnails_200_200-photo.jpg"
                    this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED has image ', imgUrl)
                  }
                  this.checkImageExists(imgUrl, (existsImage) => {
                    if (existsImage == true) {
                      projectuser['id_user'].hasImage = true
                    }
                    else {
                      projectuser['id_user'].hasImage = false

                      this.createAgentAvatarInitialsAnfBckgrnd(projectuser['id_user'])
                    }

                    this.usersLocalDbService.saveMembersInStorage(projectuser['id_user']._id, projectuser['id_user']);
                    this.usersLocalDbService.saveUserInStorageWithProjectUserId(projectuser['_id'], projectuser['id_user']);

                    this.createArrayLast_abandoned_by_project_user(projectuser['id_user'], request);
                  })
                }, error => {
                  // this.showSpinner = false;
                  this.logger.error('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED getProjectUserById - ERROR', error);
                }, () => {
                  this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED getProjectUserById - COMPLETE')

                  // const _users_found_in_storage_by_projectuserid = this.usersLocalDbService.getMemberFromStorage(project_user_id);
                  // this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED project_users_found_in_storage 2', users_found_in_storage_by_projectuserid)

                  // if (_users_found_in_storage_by_projectuserid !== null) {

                  // }

                });

            }

          }

          // ------------------------------------------------------------------------------------------
          // for the tooltip on the icon of unserved conversations showing users who have left the chat
          // ------------------------------------------------------------------------------------------
          if (request.attributes && request.attributes && request.attributes.abandoned_by_project_users) {
            this.other_project_users_that_has_abandoned_array = []
            for (const [key, value] of Object.entries(request.attributes.abandoned_by_project_users)) {
              this.logger.log('WS-REQUESTS-LIST - OTHERS PROJECT-USER THAT HAVE ABANDONED', `${key}: ${value}`);

              if (key !== request.attributes.last_abandoned_by_project_user) {

                const other_project_users_found = this.usersLocalDbService.getMemberFromStorage(key);
                // const other_project_users_found = this.project_users.filter((obj: any) => {
                //   return obj._id === key;
                // });
                this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED other_project_users_found', other_project_users_found)
                if (other_project_users_found !== null) {
                  this.logger.log('WS-REQUESTS-LIST - OTHER PROJECT-USER THAT HAS ABANDONED other_project_users_found 1', other_project_users_found)
                  this.createArrayOther_project_users_that_has_abandoned(other_project_users_found)

                } else {

                  this.usersService.getProjectUserByProjecUserId(key)
                    .subscribe((projectuser) => {
                      this.logger.log('WS-REQUESTS-LIST - OTHER PROJECT-USER THAT HAS ABANDONED getProjectUserById RES', projectuser)

                      let imgUrl = ''
                      if (this.UPLOAD_ENGINE_IS_FIREBASE === true) {
                        imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + this.storageBucket + "/o/profiles%2F" + projectuser['id_user']._id + "%2Fphoto.jpg?alt=media"
                      } else {
                        imgUrl = this.baseUrl + "images?path=uploads%2Fusers%2F" + projectuser['id_user']._id + "%2Fimages%2Fthumbnails_200_200-photo.jpg"
                        this.logger.log('WS-REQUESTS-LIST - OTHER PROJECT-USER THAT HAS ABANDONED has image ', imgUrl)
                      }
                      this.checkImageExists(imgUrl, (existsImage) => {
                        if (existsImage == true) {
                          projectuser['id_user'].hasImage = true
                        }
                        else {
                          projectuser['id_user'].hasImage = false

                          this.createAgentAvatarInitialsAnfBckgrnd(projectuser['id_user'])
                        }

                        this.usersLocalDbService.saveMembersInStorage(projectuser['id_user']._id, projectuser['id_user']);
                        this.usersLocalDbService.saveUserInStorageWithProjectUserId(projectuser['_id'], projectuser['id_user']);
                      })
                      // this.usersService.getAllUsersOfCurrentProjectAndSaveInStorage();

                      // const _other_project_users_found = this.usersLocalDbService.getMemberFromStorage(key);

                      // this.logger.log('WS-REQUESTS-LIST - OTHER PROJECT-USER THAT HAS ABANDONED other_project_users_found 2', _other_project_users_found)

                      // if (_other_project_users_found) {
                      //   this.createArrayOther_project_users_that_has_abandoned(_other_project_users_found)
                      // }
                    }, error => {
                      // this.showSpinner = false;
                      this.logger.error('WS-REQUESTS-LIST - OTHER PROJECT-USER THAT HAS ABANDONED getProjectUserById - ERROR', error);
                    }, () => {
                      this.logger.log('WS-REQUESTS-LIST - OTHER PROJECT-USER THAT HAS ABANDONED getProjectUserById - COMPLETE')

                      const _other_project_users_found = this.usersLocalDbService.getMemberFromStorage(key);
                      this.logger.log('WS-REQUESTS-LIST - OTHER PROJECT-USER THAT HAS ABANDONED other_project_users_found 2', _other_project_users_found)

                      if (_other_project_users_found) {
                        this.createArrayOther_project_users_that_has_abandoned(_other_project_users_found)
                      }
                    });
                }
                this.logger.log('WS-REQUESTS-LIST - LAST PROJECT-USER THAT HAS ABANDONED other_project_users_that_has_abandoned_array', this.other_project_users_that_has_abandoned_array)
                request['attributes']['other_project_users_that_has_abandoned_array'] = this.other_project_users_that_has_abandoned_array
              }
              // }
            }
          }

          //  replace this.currentUserID with this.auth.user_bs.value._id  because at the go back from the request's details this.currentUserID at the moment in which is passed in currentUserIdIsInParticipants is undefined 
          request['currentUserIsJoined'] = this.currentUserIdIsInParticipants(request.participants, this.auth.user_bs.value._id, request.request_id);

          if (request.status === 200) {
            // USE CASE L'ARRAY new_participants è UNDEFINED x es al refresh o quando si entra nella pagina (anche al back dal dettaglio) o all' UPDATE
            // this.logger.log('!! Ws SHARED  (from request list) PARTICIPATING-AGENTS  ', request['participantingAgents']);

            if (!request['participanting_Agents']) {

              this.logger.log('!! Ws SHARED  (from request list) PARTICIPATING-AGENTS IS ', request['participanting_Agents'], ' - RUN DO ');

              request['participanting_Agents'] = this.doParticipatingAgentsArray(request.participants, request.first_text, this.imageStorage$, this.UPLOAD_ENGINE_IS_FIREBASE)

            } else {

              this.logger.log('!! Ws SHARED  (from request list) PARTICIPATING-AGENTS IS DEFINED');
              // USE CASE L'ARRAY new_participants è definito per es arriva un nuova richiesta: new_participants x le richieste già esistenti

              // const participantingAgentsIds = []

              // request['participanting_Agents'].forEach(participant => {
              //   participantingAgentsIds.push(participant['_id'])
              // });
              // this.logger.log('!! Ws SHARED (from request list) PARTICIPATING-AGENTS IDS ARRAY ', participantingAgentsIds);
              // this.logger.log('!! Ws SHARED (from request list) PARTICIPANTS ', request.participants);
            }
          }

          // if (typeof request.lead === 'object' && request.lead !== null) {
          if (request.lead && request.lead.fullname) {
            request['requester_fullname_initial'] = avatarPlaceholder(request.lead.fullname);
            request['requester_fullname_fillColour'] = getColorBck(request.lead.fullname)
          } else {
            request['requester_fullname_initial'] = 'N/A';
            request['requester_fullname_fillColour'] = '#6264a7';
          }
          // } else {
          //   this.logger.log('WS-REQUEST-LIST LEAD ',request.lead);

          // }


          // ------------------------------------------------------------------------------------------------------------
          // !!!! REQUESTER IS VERIFIED - OLD METHOD - No more used
          // ------------------------------------------------------------------------------------------------------------
          //   if (request.lead
          //     && request.lead.attributes
          //     && request.lead.attributes.senderAuthInfo
          //     && request.lead.attributes.senderAuthInfo.authVar
          //     && request.lead.attributes.senderAuthInfo.authVar.token
          //     && request.lead.attributes.senderAuthInfo.authVar.token.firebase
          //     && request.lead.attributes.senderAuthInfo.authVar.token.firebase.sign_in_provider
          //   ) {
          //     if (request.lead.attributes.senderAuthInfo.authVar.token.firebase.sign_in_provider === 'custom') {

          //       // this.logger.log('- lead sign_in_provider ',  request.lead.attributes.senderAuthInfo.authVar.token.firebase.sign_in_provider);
          //       request['requester_is_verified'] = true;
          //     } else {
          //       // this.logger.log('- lead sign_in_provider ',  request.lead.attributes.senderAuthInfo.authVar.token.firebase.sign_in_provider);
          //       request['requester_is_verified'] = false;
          //     }

          //   } else {
          //     request['requester_is_verified'] = false;
          //   }

          // if (request.requester && request.requester.isAuthenticated === true) {
          //   request['requester_is_verified'] = true;
          // } else {
          //   request['requester_is_verified'] = false;
          // }

          // ------------------------------------------------------------------------------------------------------------
          //  to get if the requester is authenticated the 'isAuthenticated' property is obtained from snapshot.requester
          // ------------------------------------------------------------------------------------------------------------
          // if (request.snapshot && request.snapshot.requester && request.snapshot.requester.isAuthenticated) {

          //   if (request.snapshot.requester.isAuthenticated === true) {
          //     request['requester_is_verified'] = true;
          //   } else {
          //     request['requester_is_verified'] = false;
          //   }
          // } else {
          //   request['requester_is_verified'] = false;
          // }

          // -------------------------------------------------------------------------------------------------------------------------------------
          //  REQUESTER IS VERIFIED -  to get if the requester is authenticated the 'isAuthenticated' property is obtained directly from requester
          // -------------------------------------------------------------------------------------------------------------------------------------
          if (request && request.requester && request.requester.isAuthenticated) {

            if (request.requester.isAuthenticated === true) {
              request['requester_is_verified'] = true;
            } else {
              request['requester_is_verified'] = false;
            }
          } else {
            request['requester_is_verified'] = false;
          }

        });


        // -----------------------------------------     
        //  Sort requests and manage spinner
        // ----------------------------------------- 
        if (this.ws_requests) {
          this.logger.log('WS-REQUESTS-LIST *** ws_requests ***', this.ws_requests);
          this.wsRequestsUnserved = this.ws_requests
            .filter(r => {
              if (r['status'] === 100) {

                return true
              } else {
                return false
              }
            }).sort(function compare(a: Request, b: Request) {
              if (a['createdAt'] > b['createdAt']) {
                return 1;
              }
              if (a['createdAt'] < b['createdAt']) {
                return -1;
              }
              return 0;
            });

          this.wsRequestsServed = this.ws_requests
            .filter(r => {
              if (r['status'] !== 100) {

                return true
              } else {
                return false
              }
            }).sort(function compare(a: Request, b: Request) {
              if (a['createdAt'] > b['createdAt']) {
                return -1;
              }
              if (a['createdAt'] < b['createdAt']) {
                return 1;
              }
              return 0;
            });


        } else {
          // this.showSpinner = false;
        }
        this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests (served)', this.wsRequestsServed);
        this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests (unserved)', this.wsRequestsUnserved);
        this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests (served length)', this.wsRequestsServed.length);
        this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests (unserved length)', this.wsRequestsUnserved.length);
        const sum = this.wsRequestsServed.length + this.wsRequestsUnserved.length
        this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests sum)', sum);

        this.served_unserved_sum = sum;
        this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list unserved + served sum', this.wsRequestsUnserved);

        // ---------------------------------------------
        // @ Init dognut chart - to do 
        // ---------------------------------------------
        // this.initRequestsDoughnutChart();

        // this.initStackedBarChart();
        // this.initStackedBarChart_two();

        // var self = this
        // // https://stackoverflow.com/questions/8267857/how-to-wait-until-array-is-filled-asynchronous
        // var isFinished = false;
        // var count = 0 
        // // if (self.wsRequestsServed !== undefined) {
        //   var timeout = setInterval(function () {
        //     count++
        //     this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests$ (served) isFinished ', count);
        //     if (self.checkIfFinished(self.wsRequestsServed)) {
        //       this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests$ (served) isFinished 2', count);
        //       clearInterval(timeout);
        //       isFinished = true;
        //       this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests$ (served) isFinished ', isFinished, 'wsRequestsServed length ', self.wsRequestsServed.length);
        //     }
        //   }, 100);
        // }

      }, error => {
        this.logger.error('% WsRequestsList getWsRequests$ * error * ', error)
      }, () => {
        this.logger.log('% »»» WebSocketJs WF +++++ ws-requests--- list getWsRequests */* COMPLETE */*')
      })
  }


  createArrayLast_abandoned_by_project_user(user, request) {

    let imgUrl = ''
    if (this.UPLOAD_ENGINE_IS_FIREBASE === true) {
      imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + this.storageBucket + "/o/profiles%2F" + user['_id'] + "%2Fphoto.jpg?alt=media"
    } else {
      imgUrl = this.baseUrl + "images?path=uploads%2Fusers%2F" + user['_id'] + "%2Fimages%2Fthumbnails_200_200-photo.jpg"
    }

    const last_abandoned_by_project_user_array = []
    last_abandoned_by_project_user_array.push(
      {
        _id: user['_id'],
        firstname: user['firstname'],
        lastname: user['lastname'],
        has_image: user['hasImage'],
        img_url: imgUrl,
        fillColour: user['fillColour'],
        fullname_initial: user['fullname_initial']
      }
    )
    request['attributes']['last_abandoned_by_project_user_array'] = last_abandoned_by_project_user_array
  }

  createArrayOther_project_users_that_has_abandoned(other_project_users_found) {

    this.logger.log('createArrayOther_project_users_that_has_abandoned other_project_users_found', other_project_users_found)
    let imgUrl = ''
    if (this.UPLOAD_ENGINE_IS_FIREBASE === true) {
      imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + this.storageBucket + "/o/profiles%2F" + other_project_users_found['_id'] + "%2Fphoto.jpg?alt=media"
    } else {
      imgUrl = this.baseUrl + "images?path=uploads%2Fusers%2F" + other_project_users_found['_id'] + "%2Fimages%2Fthumbnails_200_200-photo.jpg"
    }

    this.other_project_users_that_has_abandoned_array.push(
      {
        _id: other_project_users_found['_id'],
        firstname: other_project_users_found['firstname'],
        lastname: other_project_users_found['lastname'],
        has_image: other_project_users_found['hasImage'],
        img_url: imgUrl,
        fillColour: other_project_users_found['fillColour'],
        fullname_initial: other_project_users_found['fullname_initial']
      }
    )
  }



  initStackedBarChart_two() {
    var config = {
      type: 'horizontalBar',
      data: {
        labels: ['Conversations'],
        datasets: [{
          label: "Assigned",
          backgroundColor: "#05BDD4",
          // hoverBackgroundColor: "rgba(154,178,96,1)",
          data: [this.wsRequestsServed.length],
        }, {
          label: "Unassigned",
          backgroundColor: "#ED4537",
          // hoverBackgroundColor: "rgba(197,213,167,1)",
          data: [this.wsRequestsUnserved.length]
        }]
      },
      options: {
        scales: {
          xAxes: [{
            stacked: true
          }],
          yAxes: [{
            stacked: true
          }]
        }
      }
    };

    const canvas = <HTMLCanvasElement>document.getElementById('stackedbarChart');
    const ctx = canvas.getContext('2d');
    // var ctx =  <HTMLCanvasElement> document.getElementById("stackedbarChart").getContext("2d");;
    new Chart(ctx, config);
  }


  initStackedBarChart() {
    var ctx = document.getElementById("stackedbarChart");
    var myChart = new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        // labels: ["2014", "2013", "2012", "2011"],

        datasets: [{
          label: "Dataset 1",
          data: [this.wsRequestsServed.length,],
          backgroundColor: "rgba(63,103,126,1)",
          hoverBackgroundColor: "rgba(50,90,100,1)"
        }, {
          label: "Unassigned",
          data: [this.wsRequestsUnserved.length],
          backgroundColor: "rgba(163,103,126,1)",
          hoverBackgroundColor: "rgba(140,85,100,1)"
        }]
      },

      options: {
        tooltips: {
          enabled: true
        },
        hover: {
          animationDuration: 0
        },
        scales: {
          xAxes: [{
            ticks: {
              beginAtZero: true,
              fontFamily: "'Open Sans Bold', sans-serif",
              fontSize: 11
            },
            scaleLabel: {
              display: false
            },
            gridLines: {
            },
            stacked: true
          }],
          yAxes: [{
            gridLines: {
              display: false,
              color: "#fff",
              zeroLineColor: "#fff",
              zeroLineWidth: 0
            },
            ticks: {
              fontFamily: "'Open Sans Bold', sans-serif",
              fontSize: 11
            },
            stacked: true
          }]
        },
        legend: {
          display: false
        }

      }
    });
  }



  // ----------------------------------------
  // Doughnut chart
  // ----------------------------------------
  initRequestsDoughnutChart() {
    var myDoughnutChart = new Chart('doughnutChart', {
      type: 'doughnut',
      data: {
        labels: ["Assigned", "Unassigned"],
        datasets: [
          {

            backgroundColor: ["#05BDD4", "#ED4537"],
            data: [this.wsRequestsServed.length, this.wsRequestsUnserved.length]
          }
        ]
      },

      options: {
        aspectRatio: 1,
        cutoutPercentage: 60,
        legend: {
          display: false,
        },
        title: {
          display: false,
          text: 'Requests'
        }
      }
    });
  }

  checkIfFinished(wsRequestsServed) {
    return (wsRequestsServed.length > 0);
  }


  _getWsRequests$() {
    this.wsRequestsService.messages.subscribe((websocketResponse) => {

      if (websocketResponse) {
        this.logger.log('% WsRequestsList getWsRequests$websocket Response', websocketResponse)

        const wsRequests = websocketResponse['payload']['message']
        this.logger.log('% WsRequestsList getWsRequests$websocket Requests (all)', wsRequests);

        this.wsRequestsUnserved = wsRequests
          .filter(r => {
            if (r['status'] === 100) {

              return true
            } else {
              return false
            }
          }).sort(function compare(a: Request, b: Request) {
            if (a['createdAt'] > b['createdAt']) {
              return 1;
            }
            if (a['createdAt'] < b['createdAt']) {
              return -1;
            }
            return 0;
          });

        this.wsRequestsServed = wsRequests
          .filter(r => {
            if (r['status'] !== 100) {

              return true
            } else {
              return false
            }
          });
      }

      this.logger.log('% WsRequestsList getWsRequests$ (served)', this.wsRequestsServed);
      this.logger.log('% WsRequestsList getWsRequests$ (unserved)', this.wsRequestsUnserved);

    }, error => {
      this.logger.error('% WsRequestsList getWsRequests$ * error * ', error)
    });
  }


  replace_recipient(request_recipient: string) {
    if (request_recipient) {
      return request_recipient.replace('support-group-', '');
    }
  }



  testWidgetPage() {
    this.testwidgetbtnRef.nativeElement.blur();

    // const url = 'http://support.tiledesk.com/testsite/?projectid=' + this.projectId;
    // + '&projectname=' + this.projectName
    // const url = 'http://testwidget.tiledesk.com/testsitenw3?projectname=' + this.projectName + ' &projectid=' + this.projectId
    const url = this.TESTSITE_BASE_URL + '?tiledesk_projectid=' + this.projectId + '&project_name=' + this.projectName + '&isOpen=true'


    // + '&prechatform=' + false + '&callout_timer=' + false + '&align=right';
    window.open(url, '_blank');
  }



  getDepartments() {
    this.departmentService.getDeptsByProjectId().subscribe((_departments: any) => {
      this.logger.log('% »»» WebSocketJs WF WS-RL - GET DEPTS RESPONSE ', _departments);
      this.departments = _departments
    }, error => {
      this.logger.error('% »»» WebSocketJs WF WS-RL - GET DEPTS - ERROR: ', error);
    }, () => {
      this.logger.log('% »»» WebSocketJs WF WS-RL - GET DEPTS * COMPLETE *')
    });
  }



  getProjectUserBotsAndDepts() {
    this.loadingAssignee = true;
    const projectUsers = this.usersService.getProjectUsersByProjectId();
    const bots = this.faqKbService.getAllBotByProjectId();
    const depts = this.departmentService.getDeptsByProjectId();


    Observable
      .zip(projectUsers, bots, depts, (_projectUsers: any, _bots: any, _depts: any) => ({ _projectUsers, _bots, _depts }))
      .subscribe(pair => {
        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-BOTS-&-DEPTS - PROJECT USERS : ', pair._projectUsers);
        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-BOTS-&-DEPTS - BOTS : ', pair._bots);
        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-BOTS-&-DEPTS - DEPTS: ', pair._depts);

        // projectUserAndLeadsArray

        if (pair && pair._projectUsers) {
          pair._projectUsers.forEach(p_user => {
            this.projectUserBotsAndDeptsArray.push({ id: p_user.id_user._id, name: p_user.id_user.firstname + ' ' + p_user.id_user.lastname + ' (' + p_user.role + ')' });
          });
        }

        if (pair && pair._bots) {
          pair._bots.forEach(bot => {
            if (bot['trashed'] === false && bot['type'] !== "identity") {
              this.projectUserBotsAndDeptsArray.push({ id: 'bot_' + bot._id, name: bot.name + ' (bot)' })
            }
          });
        }

        if (pair && pair._bots) {
          pair._depts.forEach(dept => {
            this.projectUserBotsAndDeptsArray.push({ id: dept._id, name: dept.name + ' (dept)' })
          });
        }

        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-BOTS-&-DEPTS ARRAY: ', this.projectUserBotsAndDeptsArray);

        this.projectUserBotsAndDeptsArray = this.projectUserBotsAndDeptsArray.slice(0);

      }, error => {
        this.loadingAssignee = false;
        this.logger.error('Ws-REQUESTS-LIST - GET P-USERS-&-BOTS-&-DEPTS - ERROR: ', error);
      }, () => {
        this.loadingAssignee = false;
        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-BOTS-&-DEPTS - COMPLETE');
      });

  }

  selectedAssignee() {
    this.logger.log('Ws-REQUESTS-LIST - SELECT ASSIGNEE: ', this.assignee_id);
    this.logger.log('Ws-REQUESTS-LIST - DEPTS: ', this.departments);
    // this.departments
    // const index = this.departments.findIndex((e) => e.id === this.assignee_id);
    // this.logger.log("Ws-REQUESTS-LIST - SELECT ASSIGNEE INDEX ", index);
    // if (index === 1) {
    //   this.logger.log("Ws-REQUESTS-LIST - SELECT ASSIGNEE IS A DEPT");
    // } else {
    //   this.logger.log("Ws-REQUESTS-LIST - SELECT ASSIGNEE NOT IS A DEPT");
    // }

    const hasFound = this.departments.filter((obj: any) => {

      return obj.id === this.assignee_id;

    });
    this.logger.log("Ws-REQUESTS-LIST - SELECT ASSIGNEE HAS FOUND IN DEPTS: ", hasFound);

    if (hasFound.length === 0) {

      this.assignee_dept_id = undefined
      this.assignee_participants_id = this.assignee_id
    } else {

      this.assignee_dept_id = this.assignee_id
      this.assignee_participants_id = undefined
    }
  }



  // Create an array of project user & conatct when is opened the modal create ticket
  getProjectUsersAndContacts() {
    this.loadingRequesters = true;
    const projectUsers = this.usersService.getProjectUsersByProjectId();
    const leads = this.contactsService.getAllLeadsActiveWithLimit(10000);

    Observable
      .zip(projectUsers, leads, (_projectUsers: any, _leads: any) => ({ _projectUsers, _leads }))
      .subscribe(pair => {
        this.logger.log('Ws-REQUESTS-LIST GET P-USERS-&-LEADS - PROJECT USERS : ', pair._projectUsers);
        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - LEADS RES: ', pair._leads);
        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - LEADS: ', pair._leads['leads']);

        // projectUserAndLeadsArray
        // + ' (' + p_user.role + ')'
        if (pair && pair._projectUsers) {
          pair._projectUsers.forEach(p_user => {
            this.projectUserAndLeadsArray.push({ id: p_user.id_user._id, name: p_user.id_user.firstname + ' ' + p_user.id_user.lastname, role: p_user.role, email: p_user.id_user.email, requestertype: 'agent', requester_id: p_user._id });

          });
        }

        // + ' (' + 'lead' + ')'
        if (pair && pair._leads['leads']) {
          pair._leads.leads.forEach(lead => {

            let e_mail = 'n/a'
            if (lead.email) {
              e_mail = lead.email
            }
            this.projectUserAndLeadsArray.push({ id: lead.lead_id, name: lead.fullname, role: 'lead', email: e_mail, requestertype: 'lead', requester_id: lead._id });
          });
        }

        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - PROJECT-USER-&-LEAD-ARRAY: ', this.projectUserAndLeadsArray);

        this.projectUserAndLeadsArray = this.projectUserAndLeadsArray.slice(0);

      }, error => {
        this.loadingRequesters = false;
        this.logger.error('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - ERROR: ', error);
      }, () => {
        this.loadingRequesters = false;
        this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - COMPLETE');
      });

  }

  // used nella select requester di crea ticket
  selectRequester() {
    this.logger.log('Ws-REQUESTS-LIST - SELECT REQUESTER ID', this.selectedRequester);
    this.logger.log('Ws-REQUESTS-LIST - SELECT REQUESTER ROLE',);

    const hasFound = this.projectUserAndLeadsArray.filter((obj: any) => {

      return obj.id === this.selectedRequester;

    });

    this.logger.log('Ws-REQUESTS-LIST - hasFound REQUESTER ', hasFound);

    if (hasFound.length > 0)

      this.id_for_view_requeter_dtls = hasFound[0]['requester_id'],
        this.logger.log('Ws-REQUESTS-LIST - hasFound REQUESTER id_for_view_requeter_dtls', this.id_for_view_requeter_dtls);
    if (hasFound[0]['requestertype'] === "agent") {

      this.requester_type = "agent"
      this.logger.log('Ws-REQUESTS-LIST - hasFound REQUESTER requester_type', this.requester_type);
    } else {
      this.requester_type = "lead"
      this.logger.log('Ws-REQUESTS-LIST - hasFound REQUESTER requester_type', this.requester_type);
    }
  }

  openRequesterDetails() {
    if (this.selectedRequester) {
      if (this.requester_type === "agent") {
        // this.router.navigate(['project/' + this.projectId + '/user/edit/' + this.id_for_view_requeter_dtls]);
        this.logger.log('Ws-REQUESTS-LIST - hasFound go to ', this.requester_type, ' details')

        const url = this.router.createUrlTree(['project/' + this.projectId + '/user/edit', this.id_for_view_requeter_dtls])
        this.logger.log('Ws-REQUESTS-LIST - hasFound go to url', url);
        this.logger.log('Ws-REQUESTS-LIST - hasFound go to url.toString()', url.toString());
        window.open('#' + url.toString(), '_blank');

      } else if (this.requester_type === "lead") {
        // this.router.navigate(['project/' + this.projectId + '/contact', this.id_for_view_requeter_dtls]);
        this.logger.log('Ws-REQUESTS-LIST - hasFound  go to ', this.requester_type, ' details')

        const url = this.router.createUrlTree(['project/' + this.projectId + '/contact', this.id_for_view_requeter_dtls])
        this.logger.log('Ws-REQUESTS-LIST - hasFound go to url.toString()', url.toString());
        window.open('#' + url.toString(), '_blank');
      }
      // goToContactDetails(requester_id) {
      //   this.router.navigate(['project/' + this.projectId + '/contact', requester_id]);
      // }
    }
  }

  presentModalAddNewRequester() {
    this.logger.log('Ws-REQUESTS-LIST - open modal presentModalAddNewRequester ');
    this.new_requester_email_is_valid = false;
    this.displayCreateNewUserModal = 'block'
    this.displayInternalRequestModal = 'none'
    this.new_user_name = undefined;
    this.new_user_email = undefined;
    this.HAS_CLICKED_CREATE_NEW_LEAD = false
    this.HAS_COMPLETED_CREATE_NEW_LEAD = false
    this.id_for_view_requeter_dtls = undefined;
  }

  closeCreateNewUserModal() {
    this.displayCreateNewUserModal = 'none'
    this.displayInternalRequestModal = 'block'
  }


  createProjectUserAndThenNewLead() {
    this.HAS_CLICKED_CREATE_NEW_LEAD = true;
    this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER name ', this.new_user_name);
    this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER email ', this.new_user_email);


    this.contactsService.createNewProjectUserToGetNewLeadID().subscribe(res => {
      this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-PROJECT-USER ', res);
      this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-PROJECT-USER UUID ', res.uuid_user);
      if (res) {
        if (res.uuid_user) {
          let new_lead_id = res.uuid_user
          this.createNewContact(new_lead_id, this.new_user_name, this.new_user_email)

        }
      }
    }, error => {

      this.logger.error('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-PROJECT-USER - ERROR: ', error);
    }, () => {

      this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-PROJECT-USER - COMPLETE');
    });
  }


  createNewContact(lead_id: string, lead_name: string, lead_email: string) {
    this.contactsService.createNewLead(lead_id, lead_name, lead_email).subscribe(lead => {
      this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-NEW-LEAD -  RES ', lead);
      this.projectUserAndLeadsArray.push({ id: lead.lead_id, name: lead.fullname, role: 'lead', email: lead_email, requestertype: 'lead' });
      // this.projectUserAndLeadsArray.push({ id: lead.lead_id, name: lead.fullname + ' (lead)' });
      this.projectUserAndLeadsArray = this.projectUserAndLeadsArray.slice(0);

    }, error => {

      this.logger.error('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-NEW-LEAD - ERROR: ', error);
    }, () => {
      this.HAS_COMPLETED_CREATE_NEW_LEAD = true;

      // -------------------------------------------------
      // When is cmpleted the creation of the new reqester
      // -------------------------------------------------
      this.displayCreateNewUserModal = 'none'
      this.displayInternalRequestModal = 'block'

      // Auto select the new lead crerated in the select Requester
      this.selectedRequester = lead_id

      this.notify.showWidgetStyleUpdateNotification(this.newRequesterCreatedSuccessfullyMsg, 2, 'done');

      this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-NEW-LEAD - COMPLETE');
    });
  }

  onChangeNewRequesterEmail($event) {
    this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-NEW-LEAD ON CHANGE EMAIL: ', $event);
    this.new_requester_email_is_valid = this.validateEmail($event)
    this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-NEW-LEAD ON CHANGE EMAIL - EMAIL IS VALID ', this.new_requester_email_is_valid);
  }

  validateEmail(mail) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)) {
      return (true)
    }
    this.logger.log('Ws-REQUESTS-LIST - CREATE-NEW-USER - CREATE-NEW-LEAD - validateEmail - You have entered an invalid email address! ');
    return (false)
  }

  // customSearchFn(term: string, item: any) {
  //   this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - customSearchFn term : ', term);

  //   term = term.toLocaleLowerCase();
  //   this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - customSearchFn item : ', item);

  //   this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - customSearchFn item.id.toLocaleLowerCase().indexOf(term) : ', item.id.toLocaleLowerCase().indexOf(term));
  //   this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - customSearchFn item.name.toLocaleLowerCase().indexOf(term) : ', item.id.toLocaleLowerCase().indexOf(term));

  //   return item.id.toLocaleLowerCase().indexOf(term) > -1 || item.name.toLocaleLowerCase().indexOf(term) > -1;
  // }


  // https://www.freakyjolly.com/ng-select-multiple-property-search-using-custom-filter-function/#.YDEDaJP0l7g
  // https://stackblitz.com/edit/so-angular-ng-select-searchfunc?file=app%2Fapp.component.ts
  customSearchFn(term: string, item: any) {
    this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - customSearchFn term : ', term);

    term = term.toLocaleLowerCase();
    this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - customSearchFn item : ', item);

    // this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - customSearchFn item.id.toLocaleLowerCase().indexOf(term) : ', item.id.toLocaleLowerCase().indexOf(term));
    this.logger.log('Ws-REQUESTS-LIST - GET P-USERS-&-LEADS - customSearchFn item.name.toLocaleLowerCase().indexOf(term) : ', item.name.toLocaleLowerCase().indexOf(term) > -1);

    return item.name.toLocaleLowerCase().indexOf(term) > -1 || item.email.toLocaleLowerCase().indexOf(term) > -1;
  }





  // searchForUserAndLeads(event) {
  //   this.logger.log('Ws-REQUESTS-LIST - SELECT REQUESTER searchForUserAndLeads event', event);
  // }



  presentCreateInternalRequestModal() {
    this.displayInternalRequestModal = 'block'
    this.hasClickedCreateNewInternalRequest = false;

    this.getProjectUsersAndContacts();
    this.getProjectUserBotsAndDepts();

  }

  closeInternalRequestModal() {
    this.displayInternalRequestModal = 'none'
    this.hasClickedCreateNewInternalRequest = false

    this.resetCreateInternalRequest()

  }

  createNewInternalRequest() {
    this.hasClickedCreateNewInternalRequest = true
    this.showSpinner_createInternalRequest = true
    this.logger.log('% WsRequestsList create internalRequest - internalRequest_message ', this.internalRequest_message);
    this.logger.log('% WsRequestsList create internalRequest - assignee_dept_id ', this.assignee_dept_id);
    this.logger.log('% WsRequestsList create internalRequest - assignee_participants_id ', this.assignee_participants_id);
    this.logger.log('% WsRequestsList create internalRequest - internalRequest_subject', this.internalRequest_subject);


    const uiid = uuid.v4();
    this.logger.log('% WsRequestsList create internalRequest - uiid', uiid);
    this.logger.log('% WsRequestsList create internalRequest - uiid typeof', typeof uiid);
    const uiid_no_dashes = uiid.replace(/-/g, "");;
    this.logger.log('% WsRequestsList create internalRequest - uiid_no_dash', uiid_no_dashes);
    // Note: the request id must be in the form "support-group-" + "-" + "project_id" + "uid" <- uid without dash
    // this.logger.log('% WsRequestsList createTicket - UUID', uiid);
    this.internal_request_id = 'support-group-' + this.project_id + '-' + uiid_no_dashes
    this.logger.log('% WsRequestsList create internalRequest - internal_request_id', this.internal_request_id);
    // (request_id:string, subject: string, message:string, departmentid: string)
    this.wsRequestsService.createInternalRequest(this.selectedRequester, this.internal_request_id, this.internalRequest_subject, this.internalRequest_message, this.assignee_dept_id, this.assignee_participants_id).subscribe((newticket: any) => {
      this.logger.log('% WsRequestsList create internalRequest - RES ', this.internal_request_id);


    }, error => {
      this.showSpinner_createInternalRequest = false;
      this.createNewInternalRequest_hasError = true
      this.logger.error('% WsRequestsList create internalRequest  - ERROR: ', error);
    }, () => {
      this.logger.log('% WsRequestsList create internalRequest * COMPLETE *')
      this.showSpinner_createInternalRequest = false;
      this.createNewInternalRequest_hasError = false;
      // this.hasClickedCreateNewInternalRequest = false;

    });
  }

  // NOT MORE USED  - REPLACED WITH goToInternalRequestDetails
  openTheChaForInternalRequest() {
    this.displayInternalRequestModal = 'none'
    // + '?recipient=' + this.internal_request_id;
    const url = this.CHAT_BASE_URL
    window.open(url, '_blank');

    this.resetCreateInternalRequest();
  }


  goToInternalRequestDetails() {
    this.logger.log("% WsRequestsList goToInternalRequestDetails")
    this.router.navigate(['project/' + this.projectId + '/wsrequest/' + this.internal_request_id + '/messages']);

    this.resetCreateInternalRequest();
  }

  resetCreateInternalRequest() {
    this.hasClickedCreateNewInternalRequest = false
    this.showSpinner_createInternalRequest = false
    this.createNewInternalRequest_hasError = null;
    this.internalRequest_message = undefined;
    this.assignee_dept_id = undefined;
    this.assignee_participants_id = undefined;
    this.internalRequest_subject = undefined;
    this.assignee_id = undefined;
    this.selectedRequester = undefined;
    this.id_for_view_requeter_dtls = undefined;
  }





}



