//jsv.js
  var rr = rr || {};
  rr.jsv = {
  v: '0.2.0.0'
};
  rr.templates = {
    'context-counter': '<h1>{{#count}}<span>{{count}} views logged</h1> <a class="jsv-context-resetAll">reset test</a>{{/count}}{{^count}}<h1>no pages are logged</h1>{{/count}} <a class="jsv-context-logCurrent">log current page</a></span>',
    'context-master-list-item': '<li><em>{{get_timestamp}}</em> <strong>{{page_type}}</strong><a class="jsv-context-master-deleteLog">delete</a></li>',
    'context-detail-params': '<table class="requestDetails"><thead><tr><th>Querystring Key</th><th>Name</th><th>Description</th><th>Value</th></tr></thead><tbody>{{#parameters}}<tr><td>{{key}}</td><td>{{name}}</td><td>{{description}}</td><td><div style="max-width:800px">{{val}}</div></td></tr>{{/parameters}}<tbody></table>',
    'context-detail': '<div><h1><span class="timestamp">{{get_timestamp}}</span> <strong>{{location.pathname}}</strong></h1><ul><li><h2>RR library</h2>{{library_src}}</li><li><h2>RR request</h2>{{request_src}} <a class="jsv-context-details-expandRequest">expand</a>{{> param-template}}</li><li><h2>User Agent</h2>{{user_agent}}</li><li><h2>Referrer</h2>{{referrer}}</li></ul></div>'
  };

  var Parameter = Spine.Model.setup('Parameter', ['id', 'name', 'description', 'required', 'forDisplay']);
  Parameter.selectAttributes = ['id', 'name', 'description', 'required', 'forDisplay'];
  
  Parameter.create({id:'a', name:'api key', description:'The sites unique identifier', required:true, forDisplay:false});
  Parameter.create({id:'ts', name:'time stamp', description:'The time of the request useful in logs and cache busting', required:true, forDisplay:true});
  Parameter.create({id:'cts', name:'clickthru server', description:'use for recommendation redirects', required:true, forDisplay:true});
  Parameter.create({id:'pt', name:'page type', description:'tbd', required:true, forDisplay:true});
  Parameter.create({id:'s', name:'session id', description:'tbd', required:true, forDisplay:true});
  Parameter.create({id:'u', name:'user id', description:'tbd', required:true, forDisplay:true});
  Parameter.create({id:'flv', name:'flash version', description:'tbd', required:true, forDisplay:true});
  Parameter.create({id:'l', name:'no idea', description:'tbd', required:true, forDisplay:true});
  Parameter.create({id:'undefined', name:'not named', description:'tbd', required:true, forDisplay:true});

  rr.helper = {
    simpleDateFormat: function(d){ return ("0" + (d.getMonth() + 1)).slice(-2) + '/' + ("0" + d.getDate()).slice(-2) + '/' + d.getFullYear() + ' ' + ("0" + d.getHours()).slice(-2) + ':' + ("0" + d.getMinutes()).slice(-2) + ':' + ('0' + d.getMilliseconds()).slice(-2); },
    getParams: function (string){
	  	string = string || "";
	    var ary, params = [];
      ary = string.slice(string.indexOf("?")+1).split("&");

  	  for (var i=0; i<ary.length; i++){
    	  var temp = {}, kv = ary[i].split("=");
    	
    	  try{
    	    temp = Parameter.find(kv[0]).attributes();
    	  } catch(e) {
    	    temp = Parameter.find('undefined').attributes();
    	  }

      	temp.key = kv[0];
      	temp.val = kv[1];
     	
      	params.push(temp);
  	  }

  	  return params;
  	}
  }


// TODO List
// - (1) tests
// - (2) table for requested placements
// - (3) need a list of defined parmas; but also should have a param list on each context
//   this needs to be computed *once* when object is instanciated. Should not be saved,
//   should not computed on every access.
// - (4) wrap all app logic in closure
// - (5) "use strict"
// - (6) pull var statements to top
// - (7) sort contexts by date


  $(document.body).prepend($('<div id="jsv-container"><div id="jsv-status"><span class="master-status"></span></div><div id="jsv-main"><div id="jsv-master"><ol class="items"></ol></div><div id="jsv-detail"></div><div id="jsv-footer">'));

  var Context = Spine.Model.sub();
  Context.configure('Context', 'library_src', 'location', 'referrer', 'timestamp', 'user_agent', 'request_src');
  Context.extend(Spine.Model.Local);
  Context.extend({
    exportToString:function(){
      return JSON.stringify(Context);
    },
    importfromString:function(contexts){
      contexts = JSON.parse(contexts);
      for(var i=0; i<contexts.length; i++){
        contexts[i].id='';
        Context.create(contexts[i]);
      }
    }
  });
  Context.include({
    init: function(){
      if(!arguments[0]){
        this.location = document.location;
        this.referrer = document.referrer || 'no referrer';
        this.timestamp = new Date().getTime();
        this.user_agent = navigator.userAgent || 'could not detect';
        this.request_src = 'no request found';
        this.library_src = 'no request found';
        
        // Find the RR scripts
        for( var i=0; i<document.scripts.length; i++ ){
			    var s = document.scripts[i];
			    if( typeof s.src !== undefined && s.src !== '' && s.src.indexOf( 'richrelevance.com' ) > 0 ) {
				    if ( s.src.indexOf( 'p13n.js' ) > 0 ) {
    				  this.library_src = s.src;
    			  } else if ( s.src.indexOf( 'p13n_generated.js' ) > 0 ) {
    				  this.request_src = s.src;
    			  }
    		  }
    	  }
      }
    },
    page_type: function(){
      var pageType = 'undefined', 
          pt = this.parameters('pt');
          
    if(pt.val) {
    		pageType = pt.val.replace(/|/g, "").replace(/%7C/g, "").replace(/ /g, "").replace(/%20/g, "").replace(/_/g, "");
    		pageType = pageType.slice(0, pageType.indexOf("page"));
    	}
    	
    	return pageType + ' page';
    },
    get_timestamp: function(){
      return window.rr.helper.simpleDateFormat(new Date(this.timestamp));
    },
    parameters: function(param){
      var params = rr.helper.getParams(this.request_src);
      
      if(param) {
        for(var i = 0; i<params.length; i++) {
          if (params[i].id === param) return params[i];
        }
        return Parameter.find('undefined');
      }
      
      return params;
    }
  });

  var JsvApp = Spine.Controller.sub({
    elements: {
      '.master-status': 'masterStatus',
      '.items': 'items'
    },
        
    events: {
      'click .jsv-context-resetAll': 'resetAll',
      'click .jsv-context-logCurrent': 'logCurrent'
    },

    init: function(){
      Context.bind('create', this.proxy(this.addOne) );
      Context.bind('refresh', this.proxy(this.addAll) );
      Context.bind('refresh change', this.proxy(this.renderCount) );
      Context.fetch();
      
      this.detailView = new Details({
        el: $('#jsv-detail')
      });
    },
    
    renderCount: function(){
      var html = Mustache.render(rr.templates['context-counter'], {count: Context.all().length});
      this.masterStatus.html(html);
    },
  
    addOne:function(context){
      var view = new Contexts({item: context});
      this.items.append(view.render().el);
    },

    addAll: function(){
      Context.each(this.proxy(this.addOne));
    },
    
    resetAll: function(e){
      if(window.confirm('Clear all saved views?')){
        Context.destroyAll();
      }
    },
    
    logCurrent: function(e){
      Context.create();
    }
  });

  var Contexts = Spine.Controller.sub({
    proxies: ['viewDetails', 'remove'],
    
    current: {},
  
    init: function(){
      this.item.bind('update', this.proxy(this.render));
      this.item.bind("destroy", this.proxy(this.remove));
    },
    
    events: {
      'click .jsv-context-master-deleteLog': 'destroy',
      'click': 'viewDetails'
    },
  
    render: function(){
      var html = Mustache.render(rr.templates['context-master-list-item'], this.item);
      this.replace(html);
      return this;
    },
    
    remove: function(e){
      this.el.remove();
      this.release();
    },
    
    destroy: function(e){
      if(this.current === this.item){
        Context.trigger('showDetails');
      }
    
      this.item.destroy();
      e.stopPropagation()
      return false;
    },
    
    viewDetails: function(e){
      this.current = this.item;
      Context.trigger('showDetails', this.item);
      this.el.addClass('active').siblings().removeClass('active');
    }
  });
  
  var Details = Spine.Controller.sub({
    init: function(){
      Context.bind('showDetails', this.proxy(this.render));
    },
    
    elements: {
      "table.requestDetails": "requestDetailsTable"
    },
    
    events: {
      'click .jsv-context-details-expandRequest': 'hideShowTable'
    },
    
    hideShowTable: function(e){
      $(e.currentTarget).text( ($(e.currentTarget).text() === 'expand') ? 'collapse' : 'expand');
      this.requestDetailsTable.toggle();
    },
    
    render: function(context){
      var html = '';
      if (context) {
        html = Mustache.render(rr.templates['context-detail'], context, {'param-template': rr.templates['context-detail-params']});
      }
      this.html(html);
      return this;
    }
  });

  new JsvApp({
    el: $('#jsv-container')
  });