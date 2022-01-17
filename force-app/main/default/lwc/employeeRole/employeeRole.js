/*eslint no-console: “error”*/
import {LightningElement, api, wire} from 'lwc';
import getRoleInformation from '@salesforce/apex/LWCEmployeeRoleController.getRoleInformation';
import getRoleInformationByName from '@salesforce/apex/LWCEmployeeRoleController.getRoleInformationByName';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
const ROLE_FIELD = 'Contact.Role__c';


export default class EmployeeCareerPathSubtab extends LightningElement {
    @api employeeid;
    @api selectedrole;
    roleName = '';
    isCollapsed = false;
    roleInfo;

    connectedCallback () {
        this.refreshRoleInfo(this.selectedrole);
    }

    @api 
  	refreshRoleInfo(newRole) {
        this.selectedrole = newRole
    	if (this.selectedrole) {
            getRoleInformationByName({roleName : this.selectedrole})
            .then(role => {
                if (role) {
                    this.roleInfo = role
                }
            })
            .catch(error => {
                console.log (error);
            });
        }
    }

    @wire(getRecord, {recordId: '$employeeid', fields: [ROLE_FIELD]})
    loadContactInfo({error, data}) {
        if (error) {
            console.log(error);
        }else if (data) {
            this.roleName = getFieldValue(data, ROLE_FIELD);
            this.getRoleInfo();
        }
    }

    getRoleInfo()
    {
        if (this.roleName !== '') {
            getRoleInformation({empId : this.employeeid})
            .then(role => {
                if (role) {
                    this.roleInfo = role
                }
            })
            .catch(error => {
                console.log (error);
            });
        } 
    }

    handleClick() {
        this.isCollapsed = !this.isCollapsed;
    }

    get cssClass(){
        return !this.isCollapsed ? 'slds-accordion__content':'slds-hide'  + ' slds-var-p-left_small';
    }
    get cssOpen(){
        return !this.isCollapsed ? 'slds-accordion__section slds-is-open':'slds-accordion__section';
    }
    
    get iconName(){
        return !this.isCollapsed ? 'utility:chevrondown' : 'utility:chevronright';
    }
}