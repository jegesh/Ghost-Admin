import ShortcutsRoute from 'ghost/mixins/shortcuts-route';
import mobileUtils from 'ghost/utils/mobile-utils';

var ApplicationRoute = Ember.Route.extend(Ember.SimpleAuth.ApplicationRouteMixin, ShortcutsRoute, {

    shortcuts: {
        'esc': 'closePopups'
    },
    beforeModel: function () {
        var self = this;
        if (this.get('session').isAuthenticated) {
            this.store.find('user', 'me').then(function (user) {
                // Update the user on all routes and controllers
                self.container.unregister('user:current');
                self.container.register('user:current', user, { instantiate: false });

                self.container.injection('route', 'user', 'user:current');
                self.container.injection('controller', 'user', 'user:current');

            });
        }
    },
    mobileInteractions: function () {
        var responsiveAction = mobileUtils.responsiveAction;

        Ember.run.scheduleOnce('afterRender', document, function () {
            // ### Toggle the sidebar menu
            $('[data-off-canvas]').on('click', function (event) {
                responsiveAction(event, '(max-width: 650px)', function () {
                    $('body').toggleClass('off-canvas');
                });
            });
        });
    }.on('init'),

    setupController: function () {
        Ember.run.next(this, function () {
            this.send('loadServerNotifications');
        });
    },

    actions: {
        closePopups: function () {
            this.get('popover').closePopovers();
            this.get('notifications').closeAll();

            this.send('closeModal');
        },

        signedIn: function (user) {
            // Update the user on all routes and controllers
            this.container.unregister('user:current');
            this.container.register('user:current', user, { instantiate: false });

            this.container.injection('route', 'user', 'user:current');
            this.container.injection('controller', 'user', 'user:current');

            this.set('user', user);
            this.set('controller.user', user);

            this.send('loadServerNotifications', true);
        },

        signedOut: function () {
            // Nullify the user on all routes and controllers
            this.container.unregister('user:current');
            this.container.register('user:current', null, { instantiate: false });

            this.container.injection('route', 'user', 'user:current');
            this.container.injection('controller', 'user', 'user:current');

            this.set('user', null);
            this.set('controller.user', null);
        },

        openModal: function (modalName, model, type) {
            modalName = 'modals/' + modalName;
            // We don't always require a modal to have a controller
            // so we're skipping asserting if one exists
            if (this.controllerFor(modalName, true)) {
                this.controllerFor(modalName).set('model', model);

                if (type) {
                    this.controllerFor(modalName).set('imageType', type);
                    this.controllerFor(modalName).set('src', model.get(type));
                }
            }
            return this.render(modalName, {
                into: 'application',
                outlet: 'modal'
            });
        },

        closeModal: function () {
            return this.disconnectOutlet({
                outlet: 'modal',
                parentView: 'application'
            });
        },

        loadServerNotifications: function (isDelayed) {
            var self = this;
            if (this.session.isAuthenticated) {
                this.store.findAll('notification').then(function (serverNotifications) {
                    serverNotifications.forEach(function (notification) {
                        self.notifications.handleNotification(notification, isDelayed);
                    });
                });
            }
        },

        handleErrors: function (errors) {
            var self = this;
            this.notifications.clear();
            errors.forEach(function (errorObj) {
                self.notifications.showError(errorObj.message || errorObj);

                if (errorObj.hasOwnProperty('el')) {
                    errorObj.el.addClass('input-error');
                }
            });
        }
    }
});

export default ApplicationRoute;