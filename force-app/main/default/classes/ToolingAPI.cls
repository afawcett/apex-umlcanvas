/**
 * Copyright (c) 2013, Apex Tooling API
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 *   are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 *      this list of conditions and the following disclaimer in the documentation
 *      and/or other materials provided with the distribution.
 * - Neither the name of the Apex Tooling API, inc nor the names of its contributors
 *      may be used to endorse or promote products derived from this software without
 *      specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 *  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

/**
 * IMPORTANT NOTE: This is a reduced version of this file to remove unused code from coverage
 **/
public with sharing class ToolingAPI {

    /**
     * Complete list of all Tooling API objects (as per those in WSDL that extend tns:sObject)
     **/
    public enum SObjectType {
        ApexClass,
        ApexClassMember,
        ApexCodeCoverage,
        ApexCodeCoverageAggregate,
        ApexComponent,
        ApexComponentMember,
        ApexExecutionOverlayAction,
        ApexExecutionOverlayResult,
        ApexLog,
        ApexOrgWideCoverage,
        ApexPage,
        ApexPageMember,
        ApexTestQueueItem,
        ApexTestResult,
        ApexTrigger,
        ApexTriggerMember,
        AsyncApexJob,
        ContainerAsyncRequest,
        CustomObject,
        CustomField,
        MetadataContainer,
        MetadataContainerMember,
        Name,
        StaticResource,
        TraceFlag,
        User,
        UserPreference
    }

    // The API version used relates to the types and structures defined here
    private static final String TOOLING_API_URI = '/services/data/v29.0/tooling';

    // Session Id can be resovled automatically depending on consturctor used
    private String sessionId;

    // Interface used to implement customi serialization on SObject based types
    private interface ISerialize {
        void serialize(JSONGenerator generator);
    }

    /**
     * Uses the current users Session Id, only compatible in a interactive context
     * @throws ToolingAPIException if no Session Id can be resolved (e.g. in a batch context)
     **/
    public ToolingAPI() {
        this.sessionId = UserInfo.getSessionId();
        if(this.sessionId==null)
            throw new ToolingAPIException('Unable to obtain Session Id');
    }

    /**
     * Uses the given Session Id, useful when using the API in a batch context
     **/
    public ToolingAPI(String sessionId) {
        this.sessionId = sessionId;
    }

    /**
     * Using this query as an example for calling the private static helper method.
     * query
     * @description Uses the queryString to issue a query via the Tooling API
     * @param The query string to use
     * @return a ToolingAPI Query Result
     * @throws ToolingAPIException if an an exception was encountered.
     */
    public QueryResult query(String queryString) {
        HttpResponse response = submitRestCall('/query/?q=' + EncodingUtil.urlEncode(queryString, 'UTF-8'));
        return parseQueryResult(response.getBody());
    }

    /**
     * Generic method for deleting an sobject record
     * @param sobjType name of one of the valid Tooling API SObject's
     * @param sobjectId Id of the applicable record to delete
     **/
    public ToolingAPI.SaveResult deleteSObject(SObjectType sobjType, Id sobjectId){
        return (ToolingAPI.SaveResult) submitRestCallAndDeserialize(
            '/sobjects/'+sobjType.name()+'/'+sobjectId
            ,ToolingAPI.SaveResult.class
            ,'DELETE'
        );
    }

    /**
     * Generic methods for creating an sobject record
     * @param sobjectRecord The sobject record to create.
     **/
    public ToolingAPI.SaveResult createSObject(SObject_x sobjectRecord)
    {
        return (ToolingAPI.SaveResult) submitRestCallAndDeserialize(
            '/sobjects/'+sobjectRecord.type_x
            ,ToolingAPI.SaveResult.class
            ,'POST'
            ,sobjectRecord
        );
    }

    //Public Inner Classes for Handling Tooling API Requests

    public class AggregateExpressionResultColumnMetadata {
        public String displayName;
    }

    public class ApexClass extends SObject_x implements ISerialize {
        public Double            apiVersion;
        public String            body;
        public Double            bodyCrc;
        public String            fullName;
        public boolean           isValid;
        public Integer           lengthWithoutComments;
        public ApexClassMetadata metadata;
        public String            name;
        public String            namespacePrefix;
        public String            status;
        public SymbolTable       symbolTable;
        public ApexClass() {
            super(SObjectType.ApexClass);
        }
        public override void serialize(JSONGenerator jsonGen) {
            super.serialize(jsonGen);
            if(apiVersion!=null)
                jsonGen.writeNumberField('apiVersion', apiVersion);
            if(body!=null)
                jsonGen.writeStringField('body', body);
            if(name!=null)
                jsonGen.writeStringField('name', name);
            if(status!=null)
                jsonGen.writeStringField('status', status);
            if(fullName!=null)
                jsonGen.writeStringField('fullName', fullName);
            if(metadata!=null)
                jsonGen.writeObjectField('metadata', metadata);
        }
    }

    public class ApexClassMetadata {
        public Double                   apiVersion;
        public PackageVersion[]         packageVersions;
        public String                   status;
    }

    public class ApexClassMember extends SObject_x implements ISerialize {
        public String            body;
        public String            content;
        public ApexClass         contentEntity;
        public String            contentEntityId;
        public Datetime          lastSyncDate;
        public ApexClassMetadata metadata;
        public MetadataContainer metadataContainer;
        public Id                metadataContainerId;        
        public SymbolTable       symbolTable;
        public ApexClassMember() {
            super(SObjectType.ApexClassMember);
        }
        public override void serialize(JSONGenerator jsonGen) {
            super.serialize(jsonGen);
            if(body!=null)
                jsonGen.writeStringField('body', body);
            if(content!=null)
                jsonGen.writeStringField('content', content);
            if(contentEntity!=null)
                jsonGen.writeObjectField('contentEntity', contentEntity);
            if(contentEntityId!=null)
                jsonGen.writeStringField('contentEntityId', contentEntityId);
            if(lastSyncDate!=null)
                jsonGen.writeDateTimeField('lastSyncDate', lastSyncDate);
            if(metadata!=null)
                jsonGen.writeObjectField('metadata', metadata);
            if(metadataContainer!=null)
                jsonGen.writeObjectField('metadataContainer', metadataContainer);
            if(metadataContainerId!=null)
                jsonGen.writeStringField('metadataContainerId', metadataContainerId);
            if(symbolTable!=null)
                jsonGen.writeObjectField('symbolTable', symbolTable);
        }
    }

    public class ApexComponentMember extends SObject_x{
        public String            body;
        public String            content;
        public ApexComponent     contentEntity;
        public Id                contentEntityId;
        public DateTime          lastSyncDate;
        public Metadata          metadata;
        public MetadataContainer metadataContainer;
        public Id                metadataContainerId;
        public ApexComponentMember() {
            super(SObjectType.ApexComponentMember);
        }
    }

    public class ApiFault {
        public String exceptionCode;
        public String exceptionMessage;
        public String upgradeURL;
        public String upgradeMessage;
    }

    public class ApiQueryFault {
        public Integer row;
        public Integer column;
    }

    public class Attribute {
        public String type;
        public String url;
    }

    public class AttributeDefinition {
        public String name;
        public String type_x;
    }
    
    public class BooleanValue {
        public Boolean value;
    }
    
    public class ChildRelationship {
        public boolean cascadeDelete;
        public String  childSObject;
        public boolean deprecatedAndHidden;
        public String  field;
        public String  relationshipName;
        public Boolean restrictedDelete;
    }

    public class ComplexQueryResultColumnMetadata {
        public QueryResultColumnMetadata[] joinColumns;
    }

    public class ContainerAsyncRequest extends SObject_x implements ISerialize {
        public String                  compilerErrors;
        public String                  errorMsg;
        public boolean                 isCheckOnly;
        public Boolean                 isDeleted;
        public Boolean                 isRunTests;
        public MetadataContainer       metadataContainer;
        public Id                      metadataContainerId;
        public MetadataContainerMember metadataContainerMember;
        public Id                      metadataContainerMemberId;
        public String                  state;
        public ContainerAsyncRequest() {
            super(SObjectType.ContainerAsyncRequest);
        }
        public override void serialize(JSONGenerator jsonGen) {
            super.serialize(jsonGen);
            if(compilerErrors!=null)
                jsonGen.writeStringField('compilerErrors', compilerErrors);
            if(errorMsg!=null)
                jsonGen.writeStringField('errorMsg', errorMsg);
            if(isCheckOnly!=null)
                jsonGen.writeBooleanField('isCheckOnly', isCheckOnly);
            if(isDeleted!=null)
                jsonGen.writeBooleanField('isDeleted', isDeleted);
            if(isRunTests!=null)
                jsonGen.writeBooleanField('isRunTests', isRunTests);
            if(metadataContainer!=null)
                jsonGen.writeObjectField('metadataContainer', metadataContainer);
            if(metadataContainerId!=null)
                jsonGen.writeStringField('metadataContainerId', metadataContainerId);
            if(metadataContainerMember!=null)
                jsonGen.writeObjectField('metadataContainerMember', metadataContainerMember);
            if(metadataContainerMemberId!=null)
                jsonGen.writeStringField('metadataContainerMemberId', metadataContainerMemberId);
            if(state!=null)
                jsonGen.writeStringField('state', state);
        }        
    }

    public class Coverage {
        public Integer[] coveredLines;
        public Integer[] uncoveredLines;
    }

    public class Error {
        public String[] fields;
        public String   message;
        public String   statusCode;
    }

    public class ErrorResponse{
        public List<String> fields;
        public String errorCode;
        public String message;
    }

    public class ExecuteAnonymousResult {
        public Integer column;
        public String  compileProblem;
        public Boolean compiled;
        public String  exceptionMessage;
        public String  exceptionStackTrace;
        public Integer line;
        public Boolean success;
    }

    public virtual class ExternalConstructor extends ExternalSymbol {
        public Parameter[] parameters;
    }

    public class ExternalMethod extends ExternalConstructor {
        public String[] argTypes;
        public String returnType;
    }

    public class ExternalReference {
        public ExternalMethod[] methods;
        public String           name;
        public String           namespace;
        public Position[]       references;
        public ExternalSymbol[] variables;
    }

    public virtual class ExternalSymbol {
        public String     name;
        public Position[] references;
    }

    public class FilterItem {
        public String field;
        public String operation;
        public String value;
        public String valueField;
    }

    public class HeapAddress {
        public String address;
        public Integer size;
        public String[] symbols;
        public StateValue value;
    }

    public class HeapDump {
        public String       className;
        public TypeExtent[] extents;
        public DateTime     heapDumpDate;
        public String       namespace;
    }

    public class InvalidateSessionsResult {
        public Error[] errors;
        public Boolean success;
    }

    public class LogInfo {
        public String category;
        public String level;
    }

    public class ListValue {
        public StateValue[] value;
    }

    public class MapEntry {
        public String     keyDisplayValue;
        public StateValue value;
    }

    public class MapValue {
        public MapEntry[] entry;
    }

    public class Metadata {
        public Double           apiVersion;
        public boolean          availableInTouch;  			//PageMetaData
        public boolean          confirmationTokenRequired; 	//PageMetaData
        public String           description; 				//PageMetadata, ComponentMetaData
        public String           fullName;
        public String           label; 						//PageMetadata, ComponentMetaData
        public String           module;
        public PackageVersion[] packageVersions;
        public String           status; 					//ClassMetadata, TriggerMetaData
        public String []        urls;
    }

    public class MetadataContainer extends SObject_x implements ISerialize {
        public Boolean isDeleted;
        public String  name;
        public MetadataContainer() {
            super(SObjectType.MetadataContainer);
        }
        public override void serialize(JSONGenerator jsonGen) {
            super.serialize(jsonGen);
            if(isDeleted!=null)
                jsonGen.writeBooleanField('isDeleted', isDeleted);
            if(Name!=null)
                jsonGen.writeStringField('name', name);
        }
    }

    public class MetadataContainerMember extends SObject_x implements ISerialize {
        public String            content;
        public SObject_x         contentEntity;
        public Id                contentEntityId;
        public DateTime          lastSyncDate;
        public MetadataContainer metadataContainer;
        public Id                metadataContainerId;
        public MetadataContainerMember() {
            super(SObjectType.MetadataContainerMember);
        }        
        public override void serialize(JSONGenerator jsonGen) {
            super.serialize(jsonGen);
            if(content!=null)
                jsonGen.writeStringField('content', content);
            if(contentEntity!=null)
                jsonGen.writeObjectField('contentEntity', contentEntity);
            if(contentEntityId!=null)
                jsonGen.writeIdField('contentEntityId', contentEntityId);
            if(lastSyncDate!=null)
                jsonGen.writeDateTimeField('lastSyncDate', lastSyncDate);
            if(metadataContainer!=null)
                jsonGen.writeObjectField('metadataContainer', metadataContainer);
            if(metadataContainerId!=null)
                jsonGen.writeObjectField('metadataContainerId', metadataContainerId);
        }        
    }

    public virtual class Constructor extends VisibilitySymbol {
        public List<Parameter> parameters;
    }

    public class Method extends Constructor {
        public String returnType;
    }

    public class NumberValue {
        public Double value;
    }

    public class PackageVersion {
        public Integer majorNumber;
        public Integer minorNumber;
        public String  namespace;
    }

    public class Parameter {
        public String name;
        public String type;
    }

    public class Position {
        public Integer column;
        public Integer line;
    }

    public class PrimitiveQueryResultColumnMetadata extends QueryResultColumnMetadata {}

    public class ProcessResult {
        public Id[]    actorIds;
        public Id      entityId;
        public Error[] errors;
        public Id      instanceId;
        public String  instanceStatus;
        public Id[]    newWorkitemIds;
        public boolean success;
    }

    public class QueryResult {
        public boolean              done;
        public String               entityTypeName;
        public String               nextRecordsUrl;
        public SObject_x[]          records;
        public Integer              size;
        public Integer              totalSize;
        public String               queryLocator;
    }

    public virtual class QueryResultColumnMetadata {
        public String  apexType;
        public String  columnName;
        public boolean custom;
        public String  displayName;
        public String  foreignKeyName;
    }

    public class QueryResultMetadata {
        public QueryResultColumnMetadata[] columnMetadata;
        public String                      entityName;
        public boolean                     groupBy;
        public boolean                     idSelected;
        public String                      keyPrefix;
    }

    public class SaveResult {
        public Error[] errors;
        public String  id;
        public boolean success;
    }

    public class SetValue {
        public StateValue[] value;
    }

    public virtual class SObject_x {
        public transient SObjectType type_x {get; private set;}
        public transient String[]    fieldsToNull;
        public Id                    id;
        public Id                    createdById;
        public User_x                createdBy;
        public DateTime              createdDate;
        public boolean               isDeleted;
        public Id                    lastModifiedById;
        public User_x                lastModifiedBy;
        public Datetime              lastModifiedDate;
        public DateTime              systemModstamp;
        public SObject_x(SObjectType sObjectType){
            type_x = sObjectType;
        }
        public virtual void serialize(JSONGenerator jsonGen) {
            if(id!=null)
                jsonGen.writeStringField('id', id);
            if(fieldsToNull!=null)
                for(String fieldToNull : fieldsToNull)
                    jsonGen.writeNullField(fieldToNull);
        }
    }

    public class SOQLResult {
        public String queryError;
        public QueryResultMetadata queryMetadata;
        public MapValue[] queryResult;
    }

    public class StateValue {}

    public class StringValue {
        public String value;
    }

    public virtual class Symbol {
        public Position   location;
        public String[]   modifiers;
        public String     name;
        public Position[] references;
        public String     type_x;
    }

    public class SymbolTable {
        public Symbol[]            constructors;
        public ExternalReference[] externalReferences;
        public String              id;
        public SymbolTable[]       innerClasses;
        public String[]            interfaces;
        public boolean             isInterface;
        public Method[]            methods;
        public String              name;
        public String              namespace;
        public VisibilitySymbol[]  properties;
        public Symbol              tableDeclaration;
        public Symbol[]            variables;
    }

    public class ToolingAPIException extends Exception{
        public ToolingAPIException(List<ErrorResponse> errorResponses){
            this(errorResponses[0].errorCode + ' : ' + errorResponses[0].message);
        }
    }

    public class ToolingAPIAuthorizationException extends Exception
    {
    	
    }

    public class TypeExtent {
        public String                collectionType;
        public Integer               count;
        public AttributeDefinition[] definition;
        public HeapAddress[]         extent;
        public Integer               totalSize;
        public String                typeName;
    }

    public class UpsertResult {
        public boolean created;
        public Error[] errors;
        public Id      id;
        public boolean success;
    }

    public class User_x extends SObject_x implements ISerialize {
        public QueryResult delegatedUsers;
        public QueryResult userPreferences;
        public Id          workspaceId;
        public User_x() {
        	super(SObjectType.User);
        }
        public override void serialize(JSONGenerator jsonGen) {
            super.serialize(jsonGen);
            if(delegatedUsers!=null)
                jsonGen.writeObjectField('delegatedUsers', delegatedUsers);
            if(userPreferences!=null)
                jsonGen.writeObjectField('userPreferences', userPreferences);
            if(workspaceId!=null)
                jsonGen.writeIdField('workspaceId', workspaceId);
        }                
    }

    public virtual class VisibilitySymbol extends Symbol {
        public String visibility;
    }

    //Private helper methods go here
    //

    /*
     * Static helper method for the "happy path" of JSON deserialization.
     * This method should be used for the public methods when the generic JSON deserialize method
     * may be used. Sends a HTTP GET request.
     */
    private Object submitRestCallAndDeserialize(String relativeUrl,Type classType){
        return submitRestCallAndDeserialize(relativeUrl, classType, 'GET');
    }

    /*
     * Static helper method for the "happy path" of JSON deserialization.
     * This method should be used for the public methods when the generic JSON deserialize method
     * may be used. Sends a HTTP requested based on method parameter.
     */
    private Object submitRestCallAndDeserialize(String relativeUrl,Type classType, String method){
        return submitRestCallAndDeserialize(relativeUrl, classType, method, null);
    }        

    /*
     * Static helper method for the "happy path" of JSON deserialization.
     * This method should be used for the public methods when the generic JSON deserialize method
     * may be used. Sends a HTTP requested based on method parameter and data.
     */
    private Object submitRestCallAndDeserialize(String relativeUrl,Type classType, String method, Object data){
        HttpResponse response = submitRestCall(relativeUrl, method, data);
        String responseBody = response.getBody();
        if(responseBody!=null && responseBody.length()>0)
            return JSON.deserialize(responseBody,classType);
        return null;
    }

    /*
     * Helper method for submitting the REST HTTP GET request.
     *
     * @throws ToolingAPIAuthorizationException if the remote site is not authorized.
     */
    private HttpResponse submitRestCall(String relativeUrl){
        return submitRestCall(relativeUrl, 'GET');
    }
    /*
     * Helper method for submitting the REST request using the given method.
     *
     * @throws ToolingAPIAuthorizationException if the remote site is not authorized.
     */
    private HttpResponse submitRestCall(String relativeUrl, String method){
        return submitRestCall(relativeUrl, method, null);
    }

    /*
     * Helper method for submitting the REST request using the given method and data.
     *
     * @throws ToolingAPIAuthorizationException if the remote site is not authorized.
     */
    private HttpResponse submitRestCall(String relativeUrl, String method, Object data){
        Http h = new Http();
        HttpRequest queryReq = new HttpRequest();
        queryReq.setEndpoint(URL.getOrgDomainUrl().toExternalForm() + TOOLING_API_URI + relativeUrl);
        queryReq.setHeader('Authorization', 'OAuth ' + this.sessionId);
        queryReq.setHeader('Content-Type', 'application/json');
        queryReq.setMethod(method);
        if(data!=null)
        {
            // Custom serializer?
            if(data instanceof ISerialize)
            {
                ISerialize dataToserialize = (ISerialize) data;
                JSONGenerator jsonGen = JSON.createGenerator(false);
                jsonGen.writeStartObject();
                dataToserialize.serialize(jsonGen);
                jsonGen.writeEndObject();
                queryReq.setBody(jsonGen.getAsString());
            }
            else
            {
                // Standard JSON serializer emits null values, 
                //    which are generally not tolerated by Tooling API
                queryReq.setBody(JSON.serialize(data));
            }
        }

        HttpResponse queryRes = null;
        try
        {
            queryRes = h.send(queryReq);
        }
        catch (System.CalloutException ce)
        {
            if (ce.getMessage().containsIgnoreCase('unauthorized endpoint'))
            {
                throw new ToolingAPIAuthorizationException(ce);
            }
            else
            {
                throw ce;
            }
        }

        Integer successCode = 200;
        if(method.equals('POST'))
            successCode = 201;
        else if(method.equals('DELETE'))
            successCode = 204;
        if(queryRes.getStatusCode() != successCode)
            if(queryRes.getBody().length()>0)
                throw new ToolingAPIException((List<ErrorResponse>) JSON.deserialize(queryRes.getBody(), List<ErrorResponse>.class));
            else
                throw new ToolingAPIException('Unexpected HTTP Status ' + queryRes.getStatusCode());
        return queryRes;
    }

    /**
     * Helper method for parsing query results
     **/
    private QueryResult parseQueryResult(String jsonStr){
        System.debug(jsonStr);
        QueryResult queryResult = (QueryResult)JSON.deserialize(jsonStr, ToolingAPI.QueryResult.class);
        queryResult.records = getQueryResultRecords(jsonStr);
        return queryResult;
    }

    /**
     * Helper method for parsing the QueryResult response and determining
     * which instance of sObject_x to use
     */
    private List<SObject_x> getQueryResultRecords(String jsonStr){

        String recordType = getRecordType(jsonStr);

        if(recordType != null){
            JSONParser parser = JSON.createParser(jsonStr);

            while (parser.nextToken() != null) {
                if ((parser.getText() == 'records')) {
                    parser.nextToken();
                    return (List<SObject_x>)parser.readValueAs(Type.forName('List<ToolingAPI.'+recordType+'>'));
                }
            }
        }

        return null;
    }

    /**
     * Helper method for parsing type attribute from query result records in JSON response
     */
    private String getRecordType(String jsonStr){
        JSONParser parser = JSON.createParser(jsonStr);

        while (parser.nextToken() != null) {
            if ((parser.getText() == 'records')) {
                while(parser.nextToken() != null) {
                    if(parser.getText() == 'attributes'){
                        while(parser.nextToken() != null){
                            if(parser.getText() == 'type'){
                                //Value of type attribute
                                parser.nextToken();
                                return parser.getText();
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
}