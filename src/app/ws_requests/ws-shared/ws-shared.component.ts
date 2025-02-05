import { Component, OnInit } from '@angular/core';
import { LocalDbService } from '../../services/users-local-db.service';
import { BotLocalDbService } from '../../services/bot-local-db.service';
import { avatarPlaceholder, getColorBck } from '../../utils/util';
import { Router } from '@angular/router';
import { WsRequestsService } from '../../services/websocket/ws-requests.service';
import { FaqKbService } from '../../services/faq-kb.service';
import { UsersService } from '../../services/users.service';
import { NotifyService } from '../../core/notify.service';
import { LoggerService } from '../../services/logger/logger.service';
@Component({
  selector: 'appdashboard-ws-shared',
  templateUrl: './ws-shared.component.html',
  styleUrls: ['./ws-shared.component.scss']
})
export class WsSharedComponent implements OnInit {

  members_array: any;
  agents_array: any;
  cleaned_members_array: any;
  requester_fullname_initial: string;
  fillColour: string;
  user_name: string;
  user_email: string;
  department_name: string;
  department_id: string;
  source_page: string;
  participantsInRequests: any;

  depts_array_noduplicate = [];
  OPEN_RIGHT_SIDEBAR = false;
  selectedQuestion: string;
  train_bot_sidebar_height: any;
  newParticipants: any
  user: any;

  // humanAgents: any;
  // botAgents: any;
  humanAgentsIdArray: any;
  botAgentsIdArray: any;
  constructor(
    public botLocalDbService: BotLocalDbService,
    public usersLocalDbService: LocalDbService,
    public router: Router,
    public wsRequestsService: WsRequestsService,
    public faqKbService: FaqKbService,
    public usersService: UsersService,
    public notify: NotifyService,
    public logger: LoggerService
  ) { }

  ngOnInit() {

  }


  // -----------------------------------------------------------------------------------------------------
  // @ Create the agent array from the request's participant id (used in ws-requests-msgs) 
  // -----------------------------------------------------------------------------------------------------
  createAgentsArrayFromParticipantsId(members_array: any, requester_id: string) {
    this.agents_array = [];
    this.cleaned_members_array = [];
    members_array.forEach(member_id => {
      // !== requester_id
      if (member_id && member_id !== 'system') {

        this.cleaned_members_array.push(member_id);
        // this.logger.log('%%% WsRequestsMsgsComponent - CLEANED MEMBERS ARRAY ', this.cleaned_members_array);

        const memberIsBot = member_id.includes('bot_');

        if (memberIsBot === true) {

          const bot_id = member_id.slice(4);
          this.logger.log('%%% WsRequestsMsgsComponent - THE PARTICIP', member_id, 'IS A BOT ', memberIsBot, ' - ID ', bot_id);

          const bot = this.botLocalDbService.getBotFromStorage(bot_id);
          if (bot) {

            this.agents_array.push({ '_id': 'bot_' + bot['_id'], 'firstname': bot['name'], 'isBot': true })

          } else {
            this.agents_array.push({ '_id': member_id, 'firstname': member_id, 'isBot': true })
          }

          // NON è UN BOT
        } else {
          this.logger.log('%%% WsRequestsMsgsComponent - MEMBER ', member_id)

          // l'utente è salvato nello storage
          const user = this.usersLocalDbService.getMemberFromStorage(member_id);

          if (user) {
            if (member_id === user['_id']) {
              // tslint:disable-next-line:max-line-length
              this.agents_array.push({ '_id': user['_id'], 'firstname': user['firstname'], 'lastname': user['lastname'], 'isBot': false })

              // this.request.push(user)
              // this.logger.log('--> THIS REQUEST - USER ', user)
            }
          } else {
            this.agents_array.push({ '_id': member_id, 'firstname': member_id, 'isBot': false })
          }
        }
      }
    });

    this.logger.log('%%% WsRequestsMsgsComponent - AGENT ARRAY ', this.agents_array)
  }


  // -----------------------------------------------------------------------------------------------------
  // @ Create the requester avatar - Richiamato da ws-request-msgs.components.ts
  // -----------------------------------------------------------------------------------------------------
  createRequesterAvatar(lead) {
    if (lead && lead.fullname) {
      this.requester_fullname_initial = avatarPlaceholder(lead.fullname);
      this.fillColour = getColorBck(lead.fullname)
    } else {

      this.requester_fullname_initial = 'N/A';
      this.fillColour = 'rgb(98, 100, 167)';
    }

  }

  // -----------------------------------------------------------------------------------------------------
  // @ Extracts the values from the "attributes" object of the request and assign them to local variables
  // -----------------------------------------------------------------------------------------------------
  destructureAttributes(attributes: any) {
    if (attributes) {
      /**
       * attributes > userFullname
       */
      if (attributes.userFullname) {
        this.user_name = attributes.userFullname;
        this.logger.log('* USER NAME: ', this.user_name);
      } else {
        this.user_name = 'n.a.'
      }

      /**
       * attributes > userEmail
       */
      if (attributes.userEmail) {
        this.user_email = attributes.userEmail;
        this.logger.log('* USER EMAIL: ', this.user_email);
      } else {
        this.user_email = 'n.a.'
      }

      /**
       * attributes > departmentName
       */
      if (attributes.departmentName) {
        this.department_name = attributes.departmentName;
        this.logger.log('* DEPATMENT NAME: ', this.department_name);
      } else {
        this.department_name = 'Default'
      }

      /**
       * attributes > departmentId
       */
      if (attributes.departmentId) {
        this.department_id = attributes.departmentId;
        this.logger.log('* DEPATMENT ID: ', this.department_id);
      } else {
        this.department_id = 'n.a.'
      }

      /**
       * attributes > sourcePage
       */
      if (attributes.sourcePage) {
        this.source_page = attributes.sourcePage;
        this.logger.log('* SOURCE PAGE: ', this.source_page);
      } else {
        this.source_page = 'n.a.'
        this.logger.log('* SOURCE PAGE: ', this.source_page);
      }

    } else {
      this.user_name = 'n.a.';
      this.user_email = 'n.a.';
      this.department_name = 'n.a.';
      this.department_id = 'n.a.';
      this.source_page = 'n.a.';
    }

  }



  doParticipatingAgentsArray(participants, first_text, imageStorage, isFirebaseUploadEngine) {
    this.logger.log('!! Ws SHARED »»»»»»» doParticipatingAgentsArray imageStorage ', imageStorage);
    this.logger.log('!! Ws SHARED »»»»»»» doParticipatingAgentsArray - first_text: ', first_text, ' participants: ', participants, 'isFirebaseUploadEngine: ', isFirebaseUploadEngine);

    const newpartarray = []
    participants.forEach(participantid => {

      const participantIsBot = participantid.includes('bot_');

      if (participantIsBot === true) {
        this.logger.log('!! Ws SHARED »»»»»»» THE PARTICIP IS A BOT?', participantIsBot, 'GET BOT FROM STORAGE');

        const bot_id = participantid.slice(4);

        const bot = this.botLocalDbService.getBotFromStorage(bot_id);
        if (bot) {
          this.logger.log('!! Ws SHARED »»»»»»» STORED BOT ', bot);

          bot['is_bot'] = true;
          newpartarray.push(bot)

        } else {
          this.logger.log('!! Ws SHARED »»»»»»» BOT IS NOT IN STORAGE  - RUN GET FROM SERVICE');

          this.faqKbService.getFaqKbById(bot_id).subscribe((bot: any) => {
            this.logger.log('!! Ws SHARED »»»»»»» GET BOT BY ID - RES', bot);


            bot['is_bot'] = true;
            newpartarray.push(bot)

            this.botLocalDbService.saveBotsInStorage(bot_id, bot);

          }, (error) => {

            this.logger.error('!! Ws SHARED »»»»»»» GET BOT BY ID - ERR', error);
          }, () => {
            this.logger.log('!! Ws SHARED »»»»»»» GET BOT BY ID - COMPLETE');
          });

        }
      } else {
        this.logger.log('!! Ws SHARED »»»»»»» THE PARTICIP IS A BOT?', participantIsBot, 'GET USER FROM STORAGE');
        const user = this.usersLocalDbService.getMemberFromStorage(participantid);
        this.logger.log('!! Ws SHARED »»»»»»» USER GET FROM STORAGE ', user);
        if (user) {
          // check if user iamge exist  
          let imgUrl = ''
          if (isFirebaseUploadEngine) {
            // ------------------------------------------------------------------------------
            // Usecase uploadEngine Firebase 
            // ------------------------------------------------------------------------------
            imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + imageStorage + "/o/profiles%2F" + participantid + "%2Fphoto.jpg?alt=media"
          } else {
            // ------------------------------------------------------------------------------
            // Usecase uploadEngine Native 
            // ------------------------------------------------------------------------------
            imgUrl = imageStorage + "images?path=uploads%2Fusers%2F" + participantid + "%2Fimages%2Fthumbnails_200_200-photo.jpg"
          }
          this.checkImageExists(imgUrl, (existsImage) => {
            if (existsImage == true) {
              user.hasImage = true
            }
            else {
              user.hasImage = false
            }
          });
          // }

          // if (user) {
          this.logger.log('!! Ws SHARED »»»»»»» STORED USER ', user);
          this.createAgentAvatar(user)
          user['is_bot'] = false
          newpartarray.push(user)

        } else {
          this.logger.log('!! Ws SHARED »»»»»»» USER IS NOT IN STORAGE - RUN GET FROM SERVICE participantid ', participantid);
          this.usersService.getProjectUserById(participantid)
            .subscribe((projectuser) => {
              this.logger.log('!! Ws SHARED »»»»»»» USER IS NOT IN STORAGE GET PROJECT-USER BY ID - RES', projectuser);
              const user: any = projectuser[0].id_user;
              this.logger.log('!! Ws SHARED »»»»»»» USER IS NOT IN STORAGE GET PROJECT-USER BY ID - RES > user ', user);

              let imgUrl = ''
              if (isFirebaseUploadEngine === true) {
                // ------------------------------------------------------------------------------
                // Usecase uploadEngine Firebase 
                // ------------------------------------------------------------------------------
                imgUrl = "https://firebasestorage.googleapis.com/v0/b/" + imageStorage + "/o/profiles%2F" + participantid + "%2Fphoto.jpg?alt=media"

              } else {
                // ------------------------------------------------------------------------------
                // Usecase uploadEngine Native 
                // ------------------------------------------------------------------------------
                imgUrl = imageStorage + "images?path=uploads%2Fusers%2F" + participantid + "%2Fimages%2Fthumbnails_200_200-photo.jpg"
              }

              this.checkImageExists(imgUrl, (existsImage) => {
                if (existsImage == true) {
                  user.hasImage = true
                }
                else {
                  user.hasImage = false
                }
              });

              user['is_bot'] = false
              this.createAgentAvatar(user)
              newpartarray.push(user)
              this.usersLocalDbService.saveMembersInStorage(user['_id'], user);

            }, (error) => {
              this.logger.error('!! Ws SHARED »»»»»»» USER IS NOT IN STORAGE - GET PROJECT-USER BY ID - ERROR ', error);
            }, () => {
              this.logger.log('!! Ws SHARED »»»»»»» USER IS NOT IN STORAGE - GET PROJECT-USER BY ID * COMPLETE *');
            });
        }
      }
    });
    return newpartarray
  }

  createAgentAvatar(agent) {
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

  checkImageExists(imageUrl, callBack) {
    var imageData = new Image();
    imageData.onload = function () {
      callBack(true);
    };
    imageData.onerror = function () {
      callBack(false);
    };
    imageData.src = imageUrl;
  }

  createFullParticipacipantsArray(request, participants: any) {
    // this.logger.log('%%% Ws SHARED »»»»»»» getBotType participants ', participants);

    if (participants.length > 0) {

      this.newParticipants = []
      participants.forEach(participantid => {

        const participantIsBot = participantid.includes('bot_')

        if (participantIsBot === true) {

          const bot_id = participantid.slice(4);


          const bot = this.botLocalDbService.getBotFromStorage(bot_id);
          if (bot) {

            this.newParticipants.push([{ '_id': participantid, 'name': bot.name, 'lastname': '', 'botType': bot.type }])
            request['test'] = this.newParticipants
            //   // '- ' +
            //   return member_id = bot['name'] + ' (bot)';
            // } else {
            //   // '- ' +
            //   return member_id

          } else {
            this.getBotFromRemoteAndSaveInStorage(bot_id, participantid)
          }

        } else {
          const user = this.usersLocalDbService.getMemberFromStorage(participantid);
          if (user) {
            this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray participants - user get from storage ', user);

            let lastnameInizial = ''
            if (user.lastname) {
              lastnameInizial = user['lastname'].charAt(0);
            }

            if (this.newParticipants.indexOf(participantid) === -1) {
              this.newParticipants.push({ '_id': participantid, 'name': user.firstname, 'lastname': lastnameInizial, 'botType': '' })
              request['test'] = this.newParticipants
            }

          } else {
            this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray participants - user NOT IN STORAGE ');

            this.getProjectuserByIdAndSaveInStorage(request, participantid);


            this.usersService.getProjectUserById(participantid)
              .subscribe((projectuser) => {

                this.newParticipants.push({ projectuser })
                request['test'] = this.newParticipants
              })

          }
        }

      });


      this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray - newParticipants Array ', this.newParticipants);
      // return this.newParticipants

    }
  }

  getBotFromRemoteAndSaveInStorage(bot_id: string, participantid: string) {

    this.faqKbService.getFaqKbById(bot_id).subscribe((res: any) => {
      this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getBotFromRemoteAndSaveInStorage - RES', res);

      this.newParticipants.push({ '_id': participantid, 'name': res.name, 'lastname': '', 'botType': res.type })

      this.botLocalDbService.saveBotsInStorage(bot_id, res);
    }, (error) => {

      this.logger.error('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getBotFromRemoteAndSaveInStorage - ERROR ', error);
    }, () => {
      this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getBotFromRemoteAndSaveInStorage * COMPLETE *');

    });

  }

  getProjectuserByIdAndSaveInStorage(request, userid) {
    // DONE -> WORKS NK-TO-TEST - da cambiare - vedi commento nel servizio
    //  this.usersService.getUsersById("5e3d47b485aa8a0017012485")

    this.usersService.getProjectUserById(userid)
      .subscribe((projectuser) => {
        this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getProjectuserByIdAndSaveInStorage - RES', projectuser);


        if (projectuser) {

          this.user = projectuser[0].id_user;

          let lastnameInizial = ''
          if (this.user.lastname) {
            lastnameInizial = this.user.lastname.charAt(0);
          }


          const index = this.newParticipants.findIndex((e) => e._id === userid);

          if (index === -1) {

            this.newParticipants.push({ '_id': userid, 'name': this.user.firstname, 'lastname': lastnameInizial, 'botType': '' })
            request['test'] = this.newParticipants
            this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray   this.newParticipants  QUI SI', this.newParticipants);
          }
          // this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray   this.newParticipants  subito dopo', this.newParticipants);
          this.usersLocalDbService.saveMembersInStorage(userid, this.user);

          // const obj = { '_id': userid, 'name': this.user.firstname, 'lastname': lastnameInizial, 'botType': '' }
          // this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getProjectuserByIdAndSaveInStorage obj ', obj)
          // newUser = { '_id': userid, 'name': this.user.firstname, 'lastname': lastnameInizial, 'botType': '' }
          // return obj
        }
      }, (error) => {
        this.logger.error('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getProjectuserByIdAndSaveInStorage - ERROR ', error);
      }, () => {
        this.logger.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getProjectuserByIdAndSaveInStorage * COMPLETE *');
      });

    // return newUser
  }

  currentUserIdIsInParticipants(participants: any, currentUserID: string, request_id): boolean {
    this.logger.log('!! Ws SHARED »»»»»»» currentUserIdIsInParticipants participants ', participants, ' currentUserID ', currentUserID)
    let currentUserIsJoined = false
    participants.forEach((participantID: string) => {

      if (participantID === currentUserID) {
        // this.logger.log('%%% Ws SHARED »»»»»»» PARTICIPANTS ', participants)
        // this.logger.log('%%% Ws SHARED »»»»»»» CURRENT_USER_ID ', currentUserID);
        currentUserIsJoined = true;
        // this.logger.log('%%% Ws SHARED »»»»»»» CURRENT USER ', currentUserID, 'is JOINED ?', currentUserIsJoined, 'to the request ', request_id);
        return
      }
    });
    // this.logger.log('%%% Ws SHARED »»»»»»» CURRENT USER ', currentUserID, ' is JOINED ?', currentUserIsJoined, 'to the request ', request_id);
    return currentUserIsJoined;
  }

  getParticipantsInRequests(ws_requests) {
    const participantsId = [];
    this.participantsInRequests = [];

    // this.humanAgents = [];
    // this.botAgents = [];
    this.botAgentsIdArray = [];
    this.humanAgentsIdArray = [];

    ws_requests.forEach(request => {

      request.participants.forEach(participant => {

        // WITH THE PURPOSE OF DISPLAYING IN THE "FILTER FOR AGENTS" ONLY THE AGENTS (WITHOUT DUPLICATES) THAT ARE PRESENT IN THE REQUESTS BELOW THE FILTER
        // I CREATE AN ARRAY OF IDS OF PARTICIPANTS:  participantsId
        // IF THE ID OF THE PARTICIPANT DOES NOT EXISTS IN THE "ARRAY participantsId" THE FOR CYCLE PROCEEDS BUILDING 
        // THE ARRAY participantsInRequests

        if (participantsId.indexOf(participant) === -1) {

          participantsId.push(participant);

          const participantIsBot = participant.includes('bot_')
          if (participantIsBot === true) {

            const bot_id = participant.slice(4);
            this.logger.log('!!! NEW REQUESTS HISTORY - THE PARTICIP', participant, 'IS A BOT ', participantIsBot, ' - ID ', bot_id);

            const bot = this.botLocalDbService.getBotFromStorage(bot_id);
            // this.logger.log('% »»» WebSocketJs WF agentsArrayBuildFromRequests bot', bot);

            if (bot) {
              this.participantsInRequests.push({ '_id': participant, 'firstname': bot.name + " (bot)" });

              this.botAgentsIdArray.push(participant);


            } else {

              this.participantsInRequests.push({ '_id': participant, 'firstname': participant + " (bot)" });
              this.botAgentsIdArray.push(participant);
            }

          } else {

            const user = this.usersLocalDbService.getMemberFromStorage(participant);
            // this.logger.log('% »»» WebSocketJs WF agentsArrayBuildFromRequests user', user);

            if (user) {
              this.participantsInRequests.push({ '_id': participant, 'firstname': user.firstname, 'lastname': user.lastname })

              // this.humanAgents.push({ '_id': participant, 'firstname': user.firstname, 'lastname': user.lastname });

              this.humanAgentsIdArray.push(participant);
            } else {

              this.participantsInRequests.push({ '_id': participant, 'firstname': participant, });

              this.humanAgentsIdArray.push(participant);
              // this._getProjectUserByUserId(participant) 
            }
          }
        }
      });

      // request['test'] = this.participantsInRequests
    });

    this.logger.log('% »»» WebSocketJs WF agentsArrayBuildFromRequests participantsId ', participantsId);
    this.logger.log('% »»» WebSocketJs WF agentsArrayBuildFromRequests ', this.participantsInRequests);


  }

  _getProjectUserByUserId(member_id) {
    this.usersService.getProjectUserByUserId(member_id)
      .subscribe((projectUser: any) => {
        this.logger.log('% Ws-REQUESTS-shared GET projectUser by USER-ID ', projectUser)
        if (projectUser) {
          this.logger.log('% Ws-REQUESTS-shared projectUser id', projectUser);

          this.usersLocalDbService.saveMembersInStorage(projectUser.id_user._id, projectUser.id_user);
        }
      }, (error) => {
        this.logger.error('% Ws-REQUESTS-shared GET projectUser by USER-ID - ERROR ', error);
      }, () => {
        this.logger.log('% Ws-REQUESTS-shared GET projectUser by USER-ID * COMPLETE *');
      });
  }




  // -----------------------------------------------------------------------------------------------------
  // @ departments in Requests & Count of depts in requests - called by ws-requests-list.component.ts
  // -----------------------------------------------------------------------------------------------------
  /**
   * Count of depts in requests !! no more get from request attributes but from dept
   * 
   * @param requests_array 
   */
  // DEPTS_LAZY: replace the existing one with this
  getDeptsAndCountOfDeptsInRequests(requests_array) {
    const depts_array = [];
    const deptsIDs = [];

    const deptsNames = [];

    requests_array.forEach((request, index) => {
      // this.logger.log('% WsRequestsList - DEPTS-COUNT request 1', request, '#', index);
      // if (request && request.attributes) {
      if (request && request.dept) {
        // this.logger.log('% WsRequestsList - DEPTS-COUNT request 2', request, '#', index);

        /**
         * CREATES AN ARRAY WITH ALL THE DEPTS RETURNED IN THE REQUESTS OBJCTS
         * (FROM THIS IS CREATED requestsDepts_uniqueArray)
         */

        // depts_array.push({ '_id': request.attributes.departmentId, 'deptName': request.attributes.departmentName }); 
        depts_array.push({ '_id': request.dept._id, 'deptName': request.dept.name });


        /**
         * CREATES AN ARRAY WITH * ONLY THE IDs * OF THE DEPTS RETURNED IN THE REQUESTS OBJCTS
         * THIS IS USED TO GET THE OCCURRENCE IN IT OF THE ID OF THE ARRAY this.requestsDepts_array
         */

        /**
         * USING DEPT ID  */
        // deptsIDs.push(request.attributes.departmentId)
        deptsIDs.push(request.dept._id);

        /**
         * USING DEPT NAME  */
        // deptsNames.push(request.attributes.departmentName)
      } else {
        // this.logger.log('REQUESTS-LIST COMP - REQUEST (else)', request, '#', index);

      }
    });
    // this.logger.log('REQUESTS-LIST COMP - DEPTS ARRAY NK', depts_array);
    // this.logger.log('REQUESTS-LIST COMP - DEPTS ID ARRAY NK', deptsIDs);
    // this.logger.log('REQUESTS-LIST COMP - DEPTS NAME ARRAY NK', deptsNames)


    // ---------------------------------------------------------------------
    //  REMOVE DUPLICATE from depts_array
    // ---------------------------------------------------------------------
    /**
     * USING DEPT ID  */
    this.depts_array_noduplicate = this.removeDuplicates(depts_array, '_id');

    /**
     * USING DEPT NAME  */
    //  this.depts_array_noduplicate = this.removeDuplicates(depts_array, 'deptName');

    // this.logger.log('% WsRequestsList - REQUESTSxDEPTS - DEPTS ARRAY [no duplicate] NK', this.depts_array_noduplicate)

    // GET OCCURRENCY OF THE DEPT ID IN THE ARRAY OF THE TOTAL DEPT ID
    this.depts_array_noduplicate.forEach(dept => {

      /**
       * USING DEPT ID  */
      this.getDeptIdOccurrence(deptsIDs, dept._id)

      /**
       * USING DEPT NAME  */
      // this.getDeptNameOccurrence(deptsNames, dept.deptName)
    });
  }


  removeDuplicates(originalArray, prop) {
    const newArray = [];
    const lookupObject = {};

    // tslint:disable-next-line:forin
    for (const i in originalArray) {
      lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    // tslint:disable-next-line:forin
    for (const i in lookupObject) {
      newArray.push(lookupObject[i]);
    }
    return newArray;
  }

  getDeptIdOccurrence(array_of_all_depts_ids, dept_id) {
    // this.logger.log('!!! ANALYTICS - ALL REQUESTS X DEPT - GET DEP OCCURRENCE FOR DEPTS ');
    const newUnicArray = []
    let count = 0;
    array_of_all_depts_ids.forEach((v) => (v === dept_id && count++));
    // this.logger.log('% WsRequestsList - REQUESTSxDEPTS - DEPT - #', count, ' REQUESTS ASSIGNED TO DEPT ', dept_id);
    let i
    for (i = 0; i < this.depts_array_noduplicate.length; ++i) {

      for (const dept of this.depts_array_noduplicate) {
        if (dept_id === dept._id) {
          dept.requestsCount = count
        }
      }
      // this.logger.log('% WsRequestsList - REQUESTSxDEPTS DEPTS ARRAY [no duplicate] NK * 2 * : ', this.depts_array_noduplicate);
    }
  }




  // ------------------------------------------------------------------------------------------------
  // MOVED FROM ws-requests-list.component.ts after the creation of the component  
  // WsRequestsUnservedComponent & WsRequestsServedComponent
  // ------------------------------------------------------------------------------------------------

  members_replace(member_id) {
    // this.logger.log('!!! NEW REQUESTS HISTORY  - SERVED BY ID ', member_id)
    // this.logger.log(' !!! NEW REQUESTS HISTORY underscore found in the participant id  ', member_id, member_id.includes('bot_'));

    const participantIsBot = member_id.includes('bot_')

    if (participantIsBot === true) {

      const bot_id = member_id.slice(4);
      // this.logger.log('!!! NEW REQUESTS HISTORY - THE PARTICIP', member_id, 'IS A BOT ', participantIsBot, ' - ID ', bot_id);

      const bot = this.botLocalDbService.getBotFromStorage(bot_id);
      if (bot) {
        // '- ' +
        return member_id = bot['name'] + ' (bot)';
      } else {
        // '- ' +
        return member_id
      }

    } else {

      const user = this.usersLocalDbService.getMemberFromStorage(member_id);
      if (user) {
        // this.logger.log('user ', user)
        if (user['lastname']) {
          const lastnameInizial = user['lastname'].charAt(0);
          // '- ' +
          return member_id = user['firstname'] + ' ' + lastnameInizial + '.'
        }
      } else {
        // '- ' +
        return member_id
      }
    }
  }





  getRequestText(text: string): string {
    if (text) {
      return text.length >= 30 ?
        text.slice(0, 30) + '...' :
        text;
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Train bot sidebar
  // -----------------------------------------------------------------------------------------------------

  openRightSideBar(message: string) {
    this.OPEN_RIGHT_SIDEBAR = true;
    this.logger.log('»»»» OPEN RIGHT SIDEBAR ', this.OPEN_RIGHT_SIDEBAR, ' MSG: ', message);
    this.selectedQuestion = message;


    // questo non funziona se è commented BUG RESOLVE
    const elemMainContent = <HTMLElement>document.querySelector('.main-content');
    this.train_bot_sidebar_height = elemMainContent.clientHeight + 10 + 'px'
    this.logger.log('REQUEST-MSGS - ON OPEN RIGHT SIDEBAR -> RIGHT SIDEBAR HEIGHT', this.train_bot_sidebar_height);

  }


  joinDeptAndLeaveCurrentAgents(deptid_selected, requestid) {
    this.logger.log('REQUEST-MSGS - JOIN DEPT AND LEAVE CURRENT AGENTS - DEPT ID ', deptid_selected);
    this.wsRequestsService.joinDept(deptid_selected, requestid)
      .subscribe((res: any) => {
        this.logger.log('REQUEST-MSGS - JOIN DEPT - RES ', res);
      }, (error) => {
        this.logger.error('REQUEST-MSGS - JOIN DEPT - RES - ERROR ', error);
      }, () => {
        this.logger.log('REQUEST-MSGS - JOIN DEPT - RES * COMPLETE *');
      });
  }



  // JOIN TO CHAT GROUP
  onJoinHandled(id_request: string, currentUserID: string) {
    // this.getFirebaseToken(() => {
    this.logger.log('%%% Ws-REQUESTS-Msgs - JOIN PRESSED');


    this.wsRequestsService.addParticipant(id_request, currentUserID)
      .subscribe((data: any) => {

        this.logger.log('%%% Ws-REQUESTS-Msgs - addParticipant TO CHAT GROUP ', data);
      }, (err) => {
        this.logger.error('%%% Ws-REQUESTS-Msgs - addParticipant TO CHAT GROUP ERROR ', err);

      }, () => {
        this.logger.log('%%% Ws-REQUESTS-Msgs - addParticipant TO CHAT GROUP COMPLETE');

        this.notify.showWidgetStyleUpdateNotification(`You are successfully added to the chat`, 2, 'done');

      });
    // });
  }

}
