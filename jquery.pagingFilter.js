/*---------------------------------------------------------------------------
 *	pagingFilter jQuery plugin
 *
 *	Description:
 *					The pagingFilter jquery plugin allows client-side paging of a group of DOM elements that are 
 *					children to the element that the plugin is assigned to.
 *							
 *					Notable Features:
 *						- It can be used for multiple lists on the same page.
 *						- It can filter the children based on their class names.
 *						- It displays paging elements, and provides modification options.
 *
 *					Options:
 *						itemsPerPage: 			A number representing the max elements to show per page (default:5)
 *						totalPageNumberLinks: 	The total number of numbered pagination navigation links to display (default:3)
 *						parentName: 			The name of the element containing the children to organize (default: DOM element ID)
 *						childName: 				The class name in 'style format' of the children to include (default: 'div')
 *						filterName: 			The class name of the filter class used on the children to filter on (default: '')
 *						currentPage: 			The default start page that the list will be navigated to (default: 1)
 *						 
 *	Owner: 			Hear It Local
 *	Developer:   	Maurice Wright
 *	Last Updated:	2011.12.12
 * 	
 *---------------------------------------------------------------------------*/

(function($){  
	$.fn.pagingFilter = function(options) {  

		// Load the options
		var o = $.extend({}, $.fn.pagingFilter.defaults, options);

		// Set the options inside of the DOM element if there's anything there.
		if ( this.length != 0 ) {
			this[0][0] = o;
		} else {
			return false;
		}
		
		// Grab any parameters that may have been set manually
		o.currentPage = $(this)[0]['currentPage'] = 1;
		o.parentName = (o.parentName=='') ? $(this).attr('id') : o.parentName;
		o.parentHeight = (o.parentHeight=='') ? null : o.parentHeight;
      
		// Get to work
		return this.each(function() {
			
			// Instantiate the object we'll use to pass to the private functions
			var obj = $(this);  
			
			// Set the parameters for the paging filter
			$.fn.pagingFilter.setPagingFilter(obj,o.currentPage);
			
			// Create the navigation commands
			$('#' + o.parentName + ' .pagingFilterUL li a').live('click', function(e) {
				e.preventDefault(e);
				pageNumber = $(this).attr('rel');
				
				// Turn off the carousel if it is running
				if ( o.duration > 0 ) stopAutomation(obj);
				$.fn.pagingFilter.setPagingFilter(obj,pageNumber);
				//console.log('1.pageNumber=',pageNumber);
			});
			
			// Turn off the carousel if it is running and any part of its container is clicked
			$('#' + o.parentName).live('click', function(e) {
				
				// Turn off the carousel if it is running
				if ( o.duration > 0 ) stopAutomation(obj);
			});
			
		});  
		
	};  	
		
	$.fn.pagingFilter.setPagingFilter = function(obj,currentPage,filterName) {

		if ( currentPage == '' ) { return; }

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// Get the existing filter
		oldFilter = o.filterName;

		// Set a default value for the filter
		if ( (typeof filterName == 'undefined') || filterName == '' ) {
			o.filterName = filterName = (o.filterName != '') ? o.filterName : '';
		} else if ( filterName == 'all' ) {
			o.filterName = filterName = '';
		} else {
			o.filterName = filterName;
		}
		o.filterName = (typeof filterName == 'undefined') ? '' : filterName;
		//console.log('1.o.filterName=',o.filterName,' 2.filterName=',filterName, ' - currentPage=',currentPage);

		// Remove the navigation so that a new one can placed.
		obj.find('.pagingFilterUL').remove();

		// Get a count of the total items that need to be paginated
		totalItems = calculateTotalItems(obj);

		// Get a count of the total number of pages that we'll have to deal with
		totalPages = calculateTotalPages(obj);

		// Set the current page number
		o.currentPage = currentPage;

		// Get a collection of the items that will be turned off, because they are not in the filter
		childrenOff = getAllChildrenNotInFilter(obj);

		// Get a collection of the items that are included in the filtering
		childrenOn = getAllChildrenInFilter(obj);

		// Get the starting item number
		startItem = calculateStartItem(obj);

		// Turn off the ones we don't need
		turnOffUnfilteredItems(obj);

		// Turn off items selected by filter that are not on the current page
		showItemsOnCurrentPageOnly(obj);

		// Add navigation
		if ( totalPages > 1 || o.alwaysShowNav ) {
			obj.prepend("<div class='pagingFilterUL'><ul>" + buildPrevLink(obj) + buildPageLinks(obj,totalPages) + buildNextLink(obj,totalPages) + "</ul><div style='clear:both;'></div></div>");
		}
		
		// Show the next page if a duration value is set
		if ( o.duration > 0 && totalPages > 1 ) {
			startAutomation(obj, totalPages);
		}
		//console.log(totalItems,totalPages,childrenOff.length,obj[0]['currentPage'],o.currentPage);

	}
	
	$.fn.pagingFilter.getPageForItem = function(obj,item) {
		
		// Get the options from the DOM array position 0,0
		var o = obj[0][0];

		// Get the existing filter
		var oldFilter = o.filterName;

		// Get a count of the total items that need to be paginated
		var totalItems = calculateTotalItems(obj);

		// Get a count of the total number of pages that we'll have to deal with
		var totalPages = calculateTotalPages(obj);
		
		if ( !(item > totalPages || item < 1) ) {
			return false;
		} else {
			return Math.ceil(item/o.itemsPerPage);
		}

	}
	
	function calculateTotalItems(obj) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// Count the number of specified child elements
		return getAllChildrenInFilter(obj).length;
	}  

	function calculateTotalPages(obj) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// Find the number of total pages
		return Math.ceil(calculateTotalItems(obj)/o.itemsPerPage);
	}  

	function calculateStartItem(obj) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// Find the number of total pages
		o.startItem = (o.currentPage-1) * o.itemsPerPage + 1;
		return o.startItem;
	}  

	function showItemsOnCurrentPageOnly(obj) {

		// Get the options from the DOM array position 0,0
		var o = obj[0][0];

		// Get the collection of all items included in the filtering
		var oAllFiltered = getAllChildrenInFilter(obj);

		// Of these, find out which ones are on the current page
		var from = o.startItem-1;
		var to = o.startItem-1+o.itemsPerPage;
		var oFiltered = oAllFiltered.slice(o.startItem-1,o.startItem-1+o.itemsPerPage);

		// Turn off the items on the inactive pages
		oAllFiltered.hide();

		// Turn on the items on the active page
		var transitionSpeed = ( o.transition == 0 ) ? null : o.transition;
		oFiltered.fadeIn(transitionSpeed);
	}

	function getAllChildrenInFilter(obj) {

		// Get the options from the DOM array position 0,0
		var o = obj[0][0];
		
		// Append the childName to each of space-delimited filters
		var str = o.filterName.replace(" ",", "+o.childName);

		// Send back all the filtered results (those that will be visible)
		// console.log('childName+filterName=',o.childName+str);
		// console.log('children in filter=',obj.children(o.childName+str));
		return obj.children(o.childName+str);
	}

	function turnOffUnfilteredItems(obj) {

		// Get the options from the DOM array position 0,0
		var o = obj[0][0];	

		// Turn off the items that are not included
		//console.log('1.',o.parentName,$('#'+o.parentName).outerHeight());
		getAllChildrenNotInFilter(obj).hide();
		
		// Assign a height to the parent before hiding everything. This will prevent unintentional scrolling.
		// The added condition is for IE7/IE8 which breaks if null is submitted into height.
		if (o.parentHeight) $('#'+o.parentName).height(o.parentHeight);
		
		// Completed
		return true;

	}

	function getAllChildrenNotInFilter(obj) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];
		
		// Append the childName to each of space-delimited filters
		str = o.filterName.replace(" ",", "+o.childName);

		// Send back the unfiltered ones (those not included)
		// console.log('Children not in filter=',obj.children().not(o.childName+str));
		return obj.children().not(o.childName+str);
	}

	function buildNav(obj,totalPages) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// Define the previous link
		prevLink = buildPrevLink(obj);

		// Define the NEXT link
		nextLink = buildNextLink(obj);
		
		// Completed
		return true;

	}

	function buildPrevLink(obj) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// What's the page number for the previous page
		var link = ( o.currentPage == 1 ) ? '' : o.currentPage*1 - 1;
		var linkClass = ( o.currentPage == 1 ) ? " class='link-current-page pagingFilter-prev '" : " class='pagingFilter-prev' ";

		// Return the link string
		return	"<li" + linkClass + "><a href='" + link + "' rel='" + link + "'>Prev</a></li>";

	}

	function buildNextLink(obj,totalPages) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// What's the page number for the previous page
		var link = ( o.currentPage == totalPages ) ? '' : o.currentPage*1 + 1;
		var linkClass = ( o.currentPage == totalPages ) ? " class='link-current-page pagingFilter-next' " : " class='pagingFilter-next'";
		

		// Return the link string
		return	"<li" + linkClass + "><a href='" + link + "' rel='" + link + "'>Next</a></li>";

	}

	function buildPageLinks(obj,totalPages) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// Find out which page links to show
		if ( totalPages <= o.totalPageNumberLinks ) {

			// Show all pages
			var link = '';
			for ( i=1; i<=totalPages; i++ ) {
				linkClass = ( i == o.currentPage ) ? " class='link-current-page pagingFilter-numbered' " : " class='pagingFilter-numbered' ";
				linkValue = ( i == o.currentPage ) ? '' : i;
				link += "<li" + linkClass + "><a href='" + linkValue + "' rel='" + linkValue + "'>" + i + "</a></li>";
			}

		} else if ( totalPages > o.totalPageNumberLinks ) {

			// Show pages on either side of the current page
			link = '&#133;'; //<== Ellipsis
			leftLinksTotal = Math.ceil((o.totalPageNumberLinks-1)/2);
			rightLinksTotal = Math.ceil((o.totalPageNumberLinks-1)/2);

			// Show ellipsis after the PREVIOUS link if we've moved far in the navigation
			link = ( o.currentPage*1 - leftLinksTotal > leftLinksTotal ) ? '<li class="ellipsis">&#133;</li>' : '';

			// Set the first link number based on the number of links to the left of the current page
			firstLink = ( o.currentPage - leftLinksTotal > 0 ) ? o.currentPage - leftLinksTotal : 1;
			
			// Make an exception for the first link if the total displayed ends with the last page.
			firstLink = ( firstLink*1 + o.totalPageNumberLinks*1 > totalPages ) ? totalPages - o.totalPageNumberLinks*1 + 1 : firstLink;
			
			// Make the last link only go as high as the number of total pages
			lastLink = ( firstLink*1 + o.totalPageNumberLinks*1 < totalPages ) ? firstLink*1 + o.totalPageNumberLinks*1 : totalPages;
			for ( i=firstLink; i<=lastLink; i++ ) {
				linkClass = ( i == o.currentPage ) ? " class='link-current-page pagingFilter-numbered' " : " class='pagingFilter-numbered' ";
				link += "<li" + linkClass + "><a href='" + i + "' rel='" + i + "'>" + i + "</a></li>";
			}

			// Show ellipsis before the NEXT link if we have for to go in the navigation, but don't show them once the last page link is visible.
			link += ( lastLink >= totalPages ) ? '' : '<li class="ellipsis">&#133;</li>';
		}

		// Semd the navigation back
		return link;

	}
	
	function startAutomation(obj, totalPages) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];

		// What's the page number for the previous page
		var link = ( o.currentPage == totalPages ) ? 1 : o.currentPage*1 + 1;
		
		// Begin a timer that will open up the next page/item
		o.timeout = setTimeout(function(){
			$.fn.pagingFilter.setPagingFilter(obj,link); 
			link = null;
			obj = null;
		},o.duration);
		
	}
	
	function stopAutomation(obj) {

		// Get the options from the DOM array position 0,0
		o = obj[0][0];
		
		// End the automation
		o.duration = 0;
		clearTimeout(o.timeout);
		
	}
	
	
	// Expose defaults to allow users to define them independently
	$.fn.pagingFilter.defaults = {
		itemsPerPage: 5,  
		totalPageNumberLinks: 3,
		parentName: '',
		parentHeight: '',
		childName: 'div',
		filterName: '',
		currentPage: 1,
		startItem: 1,
		duration: 0,
		timeout: '',
		transition: 0,
		alwaysShowNav: false
	}	
	
})(jQuery); 

	
