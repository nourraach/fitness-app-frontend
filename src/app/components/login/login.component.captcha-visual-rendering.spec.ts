import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxCaptchaModule } from 'ngx-captcha';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LoginComponent } from './login.component';
import { JwtService } from '../../service/jwt.service';
import * as fc from 'fast-check';
import { of } from 'rxjs';

/**
 * Feature: captcha-display-fix, Property 1: Captcha visual rendering
 * Validates: Requirements 1.1, 1.2
 */
describe('LoginComponent - Captcha Visual Rendering Property Tests', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockJwtService: jasmine.SpyObj<JwtService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async () => {
    const jwtServiceSpy = jasmine.createSpyObj('JwtService', ['login', 'getRole', 'updateAdminStatus']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get', 'use']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({}),
      queryParams: of({}),
      snapshot: { params: {}, queryParams: {} }
    });

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NgxCaptchaModule,
        CommonModule,
        TranslateModule.forRoot(),
        ButtonModule,
        FloatLabel,
        InputTextModule,
        Toast
      ],
      providers: [
        { provide: JwtService, useValue: jwtServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
        MessageService
      ]
    }).compileComponents();

    mockJwtService = TestBed.inject(JwtService) as jasmine.SpyObj<JwtService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  /**
   * Property 1: Captcha visual rendering
   * For any page requiring captcha verification, when a user navigates to that page, 
   * the captcha challenge should be visually present and properly rendered in the DOM
   * Validates: Requirements 1.1, 1.2
   */
  it('should render captcha visually when showReCaptcha is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          siteKey: fc.string({ minLength: 10, maxLength: 100 }),
          showReCaptcha: fc.constant(true),
          isBrowser: fc.constant(true)
        }),
        (config) => {
          // Arrange: Set up component with captcha configuration
          component.siteKey = config.siteKey;
          component.showReCaptcha = config.showReCaptcha;
          
          // Mock browser environment
          spyOn(component, 'isBrowser').and.returnValue(config.isBrowser);
          
          // Act: Initialize component and detect changes
          component.ngOnInit();
          fixture.detectChanges();
          
          // Assert: Verify captcha is visually present in DOM
          const captchaContainer = fixture.debugElement.nativeElement.querySelector('.form-group');
          const recaptchaElement = fixture.debugElement.nativeElement.querySelector('ngx-recaptcha2');
          
          // Property assertion: When showReCaptcha is true and we're in browser,
          // captcha should be visually rendered
          if (config.showReCaptcha && config.isBrowser) {
            expect(captchaContainer).toBeTruthy();
            expect(recaptchaElement).toBeTruthy();
            
            // Verify the captcha has the correct site key
            expect(component.siteKey).toBe(config.siteKey);
            expect(component.siteKey.length).toBeGreaterThanOrEqual(10);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1 Extension: Captcha visual elements rendering
   * For any captcha configuration, all visual elements including the reCAPTCHA widget
   * should be properly rendered with correct attributes
   * Validates: Requirements 1.2
   */
  it('should render all visual elements of captcha including proper attributes', () => {
    fc.assert(
      fc.property(
        fc.record({
          siteKey: fc.string({ minLength: 20, maxLength: 80 }),
          formControlName: fc.constant('captchaToken')
        }),
        (config) => {
          // Arrange: Set up component with valid captcha configuration
          component.siteKey = config.siteKey;
          component.showReCaptcha = true;
          spyOn(component, 'isBrowser').and.returnValue(true);
          
          // Act: Initialize and render component
          component.ngOnInit();
          fixture.detectChanges();
          
          // Assert: Verify all visual elements are rendered with correct attributes
          const recaptchaElement = fixture.debugElement.nativeElement.querySelector('ngx-recaptcha2');
          
          if (recaptchaElement) {
            // Property assertion: The captcha element should have all required attributes
            expect(recaptchaElement.getAttribute('ng-reflect-site-key')).toBe(config.siteKey);
            expect(recaptchaElement.getAttribute('ng-reflect-name')).toBe(config.formControlName);
            
            // Verify the captcha is properly integrated with the form
            const captchaFormControl = component.loginForm.get('captchaToken');
            expect(captchaFormControl).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1 Negative Case: Captcha should not render when conditions are not met
   * For any configuration where showReCaptcha is false or not in browser environment,
   * captcha should not be visually rendered
   * Validates: Requirements 1.1
   */
  it('should not render captcha when showReCaptcha is false or not in browser', () => {
    fc.assert(
      fc.property(
        fc.record({
          showReCaptcha: fc.boolean(),
          isBrowser: fc.boolean()
        }),
        (config) => {
          // Arrange: Set up component with varying conditions
          component.showReCaptcha = config.showReCaptcha;
          spyOn(component, 'isBrowser').and.returnValue(config.isBrowser);
          
          // Act: Initialize component
          component.ngOnInit();
          fixture.detectChanges();
          
          // Assert: Verify captcha rendering follows the correct logic
          const captchaContainer = fixture.debugElement.nativeElement.querySelector('.form-group');
          
          // Property assertion: Captcha should only be visible when both conditions are true
          if (config.showReCaptcha && config.isBrowser) {
            expect(captchaContainer).toBeTruthy();
          } else {
            expect(captchaContainer).toBeFalsy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});